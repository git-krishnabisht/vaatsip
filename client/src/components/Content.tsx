import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "../utils/users.util";
import type { Message } from "../models/Messages";
import Navbar from "./Navbar";
import { useWebSocket } from "../hooks/useWebSocket";
import { Send, Paperclip } from "lucide-react";

interface ContentProps {
  selectedUser: User | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUser?: number;
  onMessagesUpdate: (messages: Message[]) => void;
}

function Content({
  selectedUser,
  messages,
  loading,
  error,
  currentUser,
  onMessagesUpdate,
}: ContentProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(
    new Map()
  );
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef<number>(0);

  const {
    isConnected,
    sendMessage: wsSendMessage,
    sendTypingStart,
    sendTypingStop,
    onlineUsers,
    typingUsers,
    connectionStatus,
  } = useWebSocket(
    useCallback(
      (newMessage: Message) => {
        setLocalMessages((prev) => {
          const exists = prev.some(
            (msg) =>
              msg.messageId === newMessage.messageId ||
              (msg.message === newMessage.message &&
                msg.senderId === newMessage.senderId &&
                msg.receiverId === newMessage.receiverId &&
                Math.abs(
                  new Date(msg.createdAt).getTime() -
                    new Date(newMessage.createdAt).getTime()
                ) < 5000)
          );

          if (exists) return prev;

          const updated = [...prev, newMessage].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setTimeout(() => onMessagesUpdate(updated), 0);
          return updated;
        });

        setTimeout(() => scrollToBottom(), 100);
      },
      [onMessagesUpdate]
    ),

    useCallback(
      (tempId: string, sentMessage: Message) => {
        setPendingMessages((prev) => {
          const updated = new Map(prev);
          updated.delete(tempId);
          return updated;
        });

        setLocalMessages((prev) => {
          const tempMessageId = parseInt(
            tempId.replace(/[^0-9]/g, "").substring(0, 10)
          );
          const filtered = prev.filter(
            (msg) => msg.messageId !== tempMessageId
          );

          const exists = filtered.some(
            (msg) => msg.messageId === sentMessage.messageId
          );
          if (exists) {
            setTimeout(() => onMessagesUpdate(filtered), 0);
            return filtered;
          }

          const updated = [...filtered, sentMessage].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setTimeout(() => onMessagesUpdate(updated), 0);
          return updated;
        });
      },
      [onMessagesUpdate]
    ),

    useCallback((messageId: number) => {
      console.log(`Message ${messageId} delivered`);
    }, []),

    useCallback((messageId: number) => {
      console.log(`Message ${messageId} read`);
    }, [])
  );

  // Sync messages with props
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll and scroll detection
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isAtBottom && localMessages.length > 0);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [localMessages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedUser || !isConnected) {
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessageId = parseInt(tempId.replace(/[^0-9]/g, "").substring(0, 10));
    
    const tempMessage: Message = {
      messageId: tempMessageId,
      senderId: currentUser!,
      receiverId: selectedUser.id,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser!,
        name: "You",
        avatar: null,
      },
      receiver: {
        id: selectedUser.id,
        name: selectedUser.name,
        avatar: selectedUser.avatar,
      },
      attachments: [],
    };

    // Add temporary message to local state
    setLocalMessages((prev) => {
      const exists = prev.some(
        (msg) => msg.messageId === tempMessageId
      );
      if (exists) return prev;
      return [...prev, tempMessage];
    });

    // Track pending message
    setPendingMessages((prev) => new Map(prev).set(tempId, tempMessage));

    // Send via WebSocket
    const sentTempId = wsSendMessage(selectedUser.id, trimmedMessage);
    if (!sentTempId) {
      console.error("Failed to send message via WebSocket");
      // Remove the temporary message if sending failed
      setLocalMessages((prev) => prev.filter(msg => msg.messageId !== tempMessageId));
      setPendingMessages((prev) => {
        const updated = new Map(prev);
        updated.delete(tempId);
        return updated;
      });
      return;
    }

    setMessage("");

    if (isTyping) {
      sendTypingStop(selectedUser.id);
      setIsTyping(false);
    }

    inputRef.current?.focus();
  }, [
    message,
    selectedUser,
    isConnected,
    currentUser,
    wsSendMessage,
    isTyping,
    sendTypingStop,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setMessage(value);

      if (!selectedUser || !isConnected) return;

      const now = Date.now();
      lastTypingRef.current = now;

      if (!isTyping && value.trim()) {
        setIsTyping(true);
        sendTypingStart(selectedUser.id);
      }

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        if (now === lastTypingRef.current && isTyping) {
          setIsTyping(false);
          sendTypingStop(selectedUser.id);
        }
      }, 2000);

      if (!value.trim() && isTyping) {
        setIsTyping(false);
        sendTypingStop(selectedUser.id);
      }
    },
    [selectedUser, isConnected, isTyping, sendTypingStart, sendTypingStop]
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const messageArray = Array.isArray(localMessages) ? localMessages : [];
  const isUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser.id)
    : false;
  const isUserTyping = selectedUser ? typingUsers.get(selectedUser.id) : false;

  const groupedMessages = messageArray.reduce(
    (groups: { [key: string]: Message[] }, msg) => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    },
    {}
  );

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-white shadow-md"></div>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Select a conversation
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Choose from your existing conversations or start a new one to get
              started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <Navbar
          key={selectedUser.id}
          selectedUser={selectedUser}
          isOnline={isUserOnline}
          isTyping={isUserTyping}
        />
        
        {/* Connection Status Indicator */}
        {connectionStatus !== "connected" && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === "connecting" ? "bg-yellow-500 animate-pulse" :
                connectionStatus === "error" ? "bg-red-500" :
                "bg-gray-400"
              }`}></div>
              <span className="text-yellow-800">
                {connectionStatus === "connecting" ? "Connecting..." :
                 connectionStatus === "error" ? "Connection lost. Trying to reconnect..." :
                 "Disconnected"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth"
          style={{
            backgroundImage: `linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)`,
          }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-red-600 font-medium">
                  Failed to load messages
                </p>
                <p className="text-gray-500 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : messageArray.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 max-w-md">
                <div className="flex items-start space-x-3">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-yellow-800 text-sm leading-relaxed">
                    Messages are end-to-end encrypted. Only you and{" "}
                    {selectedUser?.name} can read them.
                  </p>
                </div>
              </div>

              <div className="text-center space-y-3">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <svg
                    className="w-10 h-10 text-indigo-600"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Start a conversation
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Send a message to {selectedUser?.name} to begin chatting
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Encryption Notice */}
              <div className="flex justify-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 max-w-md">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 text-yellow-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-yellow-800 text-xs">
                      End-to-end encrypted
                    </p>
                  </div>
                </div>
              </div>

              {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date} className="space-y-4">
                  <div className="flex justify-center">
                    <span className="bg-white px-4 py-1.5 rounded-full text-xs text-gray-600 shadow-sm border border-gray-200 font-medium">
                      {formatDate(dayMessages[0]!.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {dayMessages.map((msg, index) => {
                      const isOwnMessage = msg.senderId === currentUser;
                      const isPending = pendingMessages.has(
                        String(msg.messageId)
                      );
                      const isConsecutive =
                        index > 0 &&
                        dayMessages[index - 1]!.senderId === msg.senderId &&
                        new Date(msg.createdAt).getTime() -
                          new Date(
                            dayMessages[index - 1]!.createdAt
                          ).getTime() <
                          300000;

                      return (
                        <div
                          key={msg.messageId}
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          } ${isConsecutive ? "mt-1" : "mt-4"}`}
                        >
                          <div
                            className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl`}
                          >
                            <div
                              className={`px-4 py-2.5 rounded-2xl relative shadow-sm transition-all duration-200 ${
                                isOwnMessage
                                  ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white ${
                                      isConsecutive
                                        ? "rounded-br-md"
                                        : "rounded-br-2xl"
                                    } ${
                                      isPending
                                        ? "opacity-70 scale-95"
                                        : "hover:shadow-md"
                                    }`
                                  : `bg-white text-gray-800 border border-gray-200 ${
                                      isConsecutive
                                        ? "rounded-bl-md"
                                        : "rounded-bl-2xl"
                                    } hover:shadow-md`
                              }`}
                            >
                              <div className="break-words leading-relaxed">
                                {msg.message}
                              </div>
                              <div
                                className={`text-xs mt-1.5 flex items-center justify-end space-x-1 ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-gray-500"
                                }`}
                              >
                                <span className="font-medium">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isUserTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: "0ms",
                            animationDuration: "1s",
                          }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: "150ms",
                            animationDuration: "1s",
                          }}
                        />
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{
                            animationDelay: "300ms",
                            animationDuration: "1s",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {selectedUser.name} is typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-20 right-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-full p-2 shadow-lg transition-all duration-200 hover:shadow-xl z-10"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
                transform="rotate(180 10 10)"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-2 max-w-4xl mx-auto">
          {/* Attachment Button */}
          <button
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            disabled={!isConnected || !selectedUser}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={
                !isConnected
                  ? "Connecting..."
                  : !selectedUser
                  ? "Select a chat"
                  : `Message ${selectedUser.name}`
              }
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              disabled={!isConnected || !selectedUser}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200 text-sm"
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!isConnected || !selectedUser}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 flex-shrink-0 shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Content;
