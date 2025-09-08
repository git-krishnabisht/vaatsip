import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "../utils/users.util";
import type { Message } from "../models/Messages";
import Navbar from "./Navbar";
import { useWebSocket } from "../hooks/useWebSocket";
import { Paperclip, Send, Mic, Smile, Plus } from "lucide-react";

interface ContentProps {
  selectedUser: User | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUser?: number;
  onMessagesUpdate: (messages: Message[]) => void;
  isLoadingUser?: boolean;
}

function Content({
  selectedUser,
  messages,
  loading,
  error,
  currentUser,
  onMessagesUpdate,
  isLoadingUser = false,
}: ContentProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [pendingMessages, setPendingMessages] = useState<Map<string, Message>>(
    new Map()
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef<number>(0);
  const previousSelectedUserId = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    sendMessage: wsSendMessage,
    sendTypingStart,
    sendTypingStop,
    onlineUsers,
    typingUsers,
  } = useWebSocket(
    useCallback(
      (newMessage: Message) => {
        if (!selectedUser) return;

        const isRelevantMessage =
          (newMessage.senderId === currentUser &&
            newMessage.receiverId === selectedUser.id) ||
          (newMessage.senderId === selectedUser.id &&
            newMessage.receiverId === currentUser);

        if (!isRelevantMessage) return;

        // Update sidebar conversation data
        if (typeof window !== "undefined" && window.updateSidebarConversation) {
          window.updateSidebarConversation(newMessage);
        }

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

        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      },
      [onMessagesUpdate, selectedUser, currentUser]
    ),

    useCallback(
      (tempId: string, sentMessage: Message) => {
        // Update sidebar conversation data
        if (typeof window !== "undefined" && window.updateSidebarConversation) {
          window.updateSidebarConversation(sentMessage);
        }

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

  // Clear local state when user changes
  useEffect(() => {
    if (selectedUser?.id !== previousSelectedUserId.current) {
      setLocalMessages([]);
      setPendingMessages(new Map());
      setMessage("");
      setIsTyping(false);

      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      if (previousSelectedUserId.current && isTyping) {
        sendTypingStop(previousSelectedUserId.current);
      }

      previousSelectedUserId.current = selectedUser?.id || null;
    }
  }, [selectedUser?.id, isTyping, sendTypingStop]);

  // Sync messages with props
  useEffect(() => {
    if (Array.isArray(messages)) {
      setLocalMessages(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [localMessages.length, selectedUser?.id]);

  const handleSendMessage = useCallback(() => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedUser || !isConnected || !currentUser) {
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: Message = {
      messageId: parseInt(tempId.replace(/[^0-9]/g, "").substring(0, 10)),
      senderId: currentUser,
      receiverId: selectedUser.id,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser,
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

    // Update sidebar immediately with temp message
    if (typeof window !== "undefined" && window.updateSidebarConversation) {
      window.updateSidebarConversation(tempMessage);
    }

    setLocalMessages((prev) => {
      const exists = prev.some(
        (msg) => msg.messageId === tempMessage.messageId
      );
      if (exists) return prev;
      return [...prev, tempMessage];
    });

    setPendingMessages((prev) => new Map(prev).set(tempId, tempMessage));
    wsSendMessage(selectedUser.id, trimmedMessage);
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
      if (value.length > 1000) return;

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
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid time";
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return "Invalid time";
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Invalid date";

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
    } catch {
      return "Invalid date";
    }
  };

  const sanitizeMessage = (content: string) => {
    return content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  };

  const messageArray = Array.isArray(localMessages) ? localMessages : [];
  const isUserOnline = selectedUser
    ? onlineUsers.includes(selectedUser.id)
    : false;
  const isUserTyping = selectedUser ? typingUsers.get(selectedUser.id) : false;

  const groupedMessages = messageArray.reduce(
    (groups: { [key: string]: Message[] }, msg) => {
      try {
        const date = new Date(msg.createdAt).toDateString();
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date].push(msg);
        return groups;
      } catch {
        return groups;
      }
    },
    {}
  );

  return (
    <div className="flex flex-col h-full bg-white w-full min-w-0">
      {/* Navbar */}
      <div className="sticky top-0 z-10 shadow-sm flex-shrink-0">
        <Navbar
          selectedUser={selectedUser}
          isOnline={isUserOnline}
          isTyping={isUserTyping}
          isLoading={isLoadingUser}
        />
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="flex-1 overflow-y-auto px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          }}
        >
          {loading || isLoadingUser ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex flex-col items-center space-y-3 sm:space-y-4 lg:space-y-6">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 border-2 sm:border-3 border-blue-600 border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full border-2 sm:border-3 border-blue-200"></div>
                </div>
                <div className="text-gray-600 text-xs sm:text-sm lg:text-sm font-medium">
                  Loading messages...
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center p-4 sm:p-6 lg:p-8 bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm border border-red-100 sm:border-2 max-w-sm sm:max-w-md mx-auto">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-2">
                  Something went wrong
                </div>
                <div className="text-xs sm:text-sm text-red-600 font-medium">
                  {error}
                </div>
              </div>
            </div>
          ) : messageArray.length === 0 ? (
            <>
              <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
                <div className="bg-yellow-50 border border-yellow-200 sm:border-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl max-w-xs sm:max-w-md text-center shadow-sm">
                  <div className="flex items-start gap-2 lg:gap-3 text-yellow-800 text-xs sm:text-sm">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="font-medium">
                      <strong>End-to-end encrypted.</strong> Only you and{" "}
                      {selectedUser?.name} can read these messages.
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center py-6 sm:py-8 lg:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 lg:mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2">
                  Start a conversation
                </h3>
                <p className="text-sm lg:text-base text-gray-500 font-medium px-4">
                  Send a message to {selectedUser?.name} to get the conversation
                  started.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4 sm:mb-6 lg:mb-8">
                <div className="bg-yellow-50 border border-yellow-200 sm:border-2 px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl max-w-xs sm:max-w-md text-center shadow-sm">
                  <div className="flex items-start gap-2 lg:gap-3 text-yellow-800 text-xs sm:text-sm">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="font-medium">
                      <strong>End-to-end encrypted.</strong> Only you and{" "}
                      {selectedUser?.name} can read these messages.
                    </div>
                  </div>
                </div>
              </div>

              {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date}>
                  <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
                    <span className="bg-white px-2.5 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-full text-xs sm:text-sm font-bold text-gray-600 shadow-sm border border-gray-100 sm:border-2">
                      {formatDate(dayMessages[0].createdAt)}
                    </span>
                  </div>

                  {dayMessages.map((msg, index) => {
                    const isOwnMessage = msg.senderId === currentUser;
                    const isPending = Array.from(pendingMessages.values()).some(
                      (pendingMsg) => pendingMsg.messageId === msg.messageId
                    );
                    const isConsecutive =
                      index > 0 &&
                      dayMessages[index - 1].senderId === msg.senderId &&
                      new Date(msg.createdAt).getTime() -
                        new Date(dayMessages[index - 1].createdAt).getTime() <
                        300000;

                    return (
                      <div
                        key={`${msg.messageId}-${msg.createdAt}`}
                        className={`flex mb-2 sm:mb-3 lg:mb-4 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        } ${
                          isConsecutive
                            ? "mt-1 lg:mt-2"
                            : "mt-2 sm:mt-3 lg:mt-4"
                        }`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl relative transition-all duration-200 ${
                            isOwnMessage
                              ? `bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md sm:shadow-lg hover:shadow-xl rounded-br-md ${
                                  isPending
                                    ? "opacity-70 scale-95"
                                    : "hover:scale-105"
                                }`
                              : "bg-white text-gray-900 shadow-sm sm:shadow-md hover:shadow-lg rounded-bl-md border border-gray-100 sm:border-2"
                          }`}
                        >
                          <div
                            className="break-words font-medium text-xs sm:text-sm lg:text-base leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeMessage(msg.message || ""),
                            }}
                          />
                          <div
                            className={`text-xs mt-1 lg:mt-2 flex items-center justify-end gap-1 lg:gap-2 ${
                              isOwnMessage ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            <span className="font-medium">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOwnMessage && (
                              <>
                                {isPending ? (
                                  <div className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-3 h-3 lg:w-4 lg:h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {isUserTyping && (
                <div className="flex justify-start mb-2 sm:mb-3 lg:mb-4">
                  <div className="bg-white px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl lg:rounded-2xl rounded-bl-md shadow-sm sm:shadow-md border border-gray-100 sm:border-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input Area */}
        <div className="px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-4 bg-white border-t border-gray-100 sm:border-t-2 flex-shrink-0">
          <div className="flex items-end gap-1.5 sm:gap-2 lg:gap-3">
            <button
              className="p-2 sm:p-2.5 lg:p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              disabled={!isConnected || !selectedUser || isLoadingUser}
              aria-label="Add attachment"
            >
              <Plus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
            </button>

            <div className="flex-1 relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  !isConnected
                    ? "Connecting..."
                    : isLoadingUser
                    ? "Loading..."
                    : !selectedUser
                    ? "Select a chat"
                    : `Message ${selectedUser.name}`
                }
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                disabled={!isConnected || !selectedUser || isLoadingUser}
                maxLength={1000}
                className="w-full pl-2.5 sm:pl-3 lg:pl-4 pr-16 sm:pr-20 lg:pr-24 py-2 sm:py-2.5 lg:py-3 bg-gray-50 border border-transparent sm:border-2 rounded-lg sm:rounded-xl lg:rounded-2xl focus:outline-none focus:bg-white focus:border-blue-200 text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500 transition-all duration-200"
              />

              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-0.5 sm:gap-1">
                <button
                  className="p-1 sm:p-1.5 lg:p-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors"
                  disabled={!isConnected || !selectedUser || isLoadingUser}
                  aria-label="Add emoji"
                >
                  <Smile className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                </button>
                <button
                  className="p-1 sm:p-1.5 lg:p-2 text-gray-400 hover:text-blue-600 rounded-full transition-colors"
                  disabled={!isConnected || !selectedUser || isLoadingUser}
                  aria-label="Attach file"
                >
                  <Paperclip className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                </button>
              </div>
            </div>

            {message.trim() ? (
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !selectedUser || isLoadingUser}
                className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-md sm:shadow-lg hover:shadow-xl flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                disabled={!isConnected || !selectedUser || isLoadingUser}
                className="p-2 sm:p-2.5 lg:p-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full transition-all duration-150 transform hover:scale-105 active:scale-95 shadow-md sm:shadow-lg hover:shadow-xl flex-shrink-0"
                aria-label="Voice message"
              >
                <Mic className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Content;
