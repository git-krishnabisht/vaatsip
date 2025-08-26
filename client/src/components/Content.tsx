import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "../utils/users.util";
import type { Message } from "../models/Messages";
import Navbar from "./Navbar";
import { useWebSocket } from "../hooks/useWebSocket";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastTypingRef = useRef<number>(0);

  // WebSocket integration with fixed duplicate handling
  const {
    isConnected,
    sendMessage: wsSendMessage,
    sendTypingStart,
    sendTypingStop,
    onlineUsers,
    typingUsers,
    connectionStatus,
  } = useWebSocket(
    // onNewMessage - Fixed duplicate detection
    useCallback(
      (newMessage: Message) => {
        setLocalMessages((prev) => {
          // Enhanced duplicate detection
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

          // Defer parent update to avoid render cycle issues
          setTimeout(() => onMessagesUpdate(updated), 0);
          return updated;
        });

        // Auto-scroll to bottom
        setTimeout(
          () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100
        );
      },
      [onMessagesUpdate]
    ),

    // onMessageSent - Fixed temp message removal
    useCallback(
      (tempId: string, sentMessage: Message) => {
        setPendingMessages((prev) => {
          const updated = new Map(prev);
          updated.delete(tempId);
          return updated;
        });

        setLocalMessages((prev) => {
          // Remove the temporary message by matching the tempId pattern
          const tempMessageId = parseInt(
            tempId.replace(/[^0-9]/g, "").substring(0, 10)
          );
          const filtered = prev.filter(
            (msg) => msg.messageId !== tempMessageId
          );

          // Check if the sent message already exists to prevent duplicates
          const exists = filtered.some(
            (msg) => msg.messageId === sentMessage.messageId
          );
          if (exists) {
            // Defer parent update to avoid render cycle issues
            setTimeout(() => onMessagesUpdate(filtered), 0);
            return filtered;
          }

          const updated = [...filtered, sentMessage].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          // Defer parent update to avoid render cycle issues
          setTimeout(() => onMessagesUpdate(updated), 0);
          return updated;
        });
      },
      [onMessagesUpdate]
    ),

    // onMessageDelivered
    useCallback((messageId: number) => {
      console.log(`Message ${messageId} delivered`);
      // can update message status here
    }, []),

    // onMessageRead
    useCallback((messageId: number) => {
      console.log(`Message ${messageId} read`);
      // can update message status here
    }, [])
  );

  // Sync messages with props
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Fixed handleSendMessage to prevent duplicates
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !selectedUser || !isConnected) {
      return;
    }

    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const tempMessage: Message = {
      messageId: parseInt(tempId.replace(/[^0-9]/g, "").substring(0, 10)),
      senderId: currentUser!,
      receiverId: selectedUser.id,
      message: message.trim(),
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

    // Add pending message to local state with duplicate check
    setLocalMessages((prev) => {
      const exists = prev.some(
        (msg) => msg.messageId === tempMessage.messageId
      );
      if (exists) return prev;
      return [...prev, tempMessage];
    });

    setPendingMessages((prev) => new Map(prev).set(tempId, tempMessage));

    // Send via WebSocket
    wsSendMessage(selectedUser.id, message.trim());
    setMessage("");

    // Stop typing indicator
    if (isTyping) {
      sendTypingStop(selectedUser.id);
      setIsTyping(false);
    }
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

      // Start typing indicator
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        sendTypingStart(selectedUser.id);
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = window.setTimeout(() => {
        if (now === lastTypingRef.current && isTyping) {
          setIsTyping(false);
          sendTypingStop(selectedUser.id);
        }
      }, 2000);

      // Stop typing if message becomes empty
      if (!value.trim() && isTyping) {
        setIsTyping(false);
        sendTypingStop(selectedUser.id);
      }
    },
    [selectedUser, isConnected, isTyping, sendTypingStart, sendTypingStop]
  );

  // Cleanup typing timeout
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

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status Bar */}
      {connectionStatus !== "connected" && (
        <div
          className={`px-4 py-2 text-center text-sm ${
            connectionStatus === "connecting"
              ? "bg-yellow-100 text-yellow-800"
              : connectionStatus === "error"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {connectionStatus === "connecting" && "Connecting..."}
          {connectionStatus === "error" && "Connection failed. Retrying..."}
          {connectionStatus === "disconnected" && "Reconnecting..."}
        </div>
      )}

      <div className="sticky top-0 z-10 border-b border-black bg-gray-100">
        <Navbar
          selectedUser={selectedUser}
          isOnline={isUserOnline}
          isTyping={isUserTyping}
        />
      </div>

      <div className="flex-1 flex flex-col bg-gray-100 min-h-0">
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width="260" height="260" viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23f0f0f0" fill-opacity="0.1"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : messageArray.length === 0 ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-200 px-3 py-2 rounded-lg max-w-md text-center">
                  <div className="flex items-start gap-2 text-amber-800 text-xs">
                    <span>
                      Messages and calls are end-to-end encrypted. Only people
                      in this chat can read, listen to, or share them. Click to
                      learn more
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center text-gray-500 text-sm">
                No conversation yet. Start a new chat with {selectedUser?.name}.
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="bg-yellow-200 px-3 py-2 rounded-lg max-w-md text-center">
                  <div className="flex items-start gap-2 text-amber-800 text-xs">
                    <span>
                      Messages and calls are end-to-end encrypted. Only people
                      in this chat can read, listen to, or share them. Click to
                      learn more
                    </span>
                  </div>
                </div>
              </div>

              {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date}>
                  <div className="flex justify-center mb-4">
                    <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm border border-gray-200">
                      {formatDate(dayMessages[0].createdAt)}
                    </span>
                  </div>

                  {dayMessages.map((msg, index) => {
                    const isOwnMessage = msg.senderId === currentUser;
                    const isPending = pendingMessages.has(
                      String(msg.messageId)
                    );
                    const isConsecutive =
                      index > 0 &&
                      dayMessages[index - 1].senderId === msg.senderId &&
                      new Date(msg.createdAt).getTime() -
                        new Date(dayMessages[index - 1].createdAt).getTime() <
                        300000;

                    return (
                      <div
                        key={msg.messageId}
                        className={`flex mb-2 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        } ${isConsecutive ? "mt-1" : "mt-3"}`}
                      >
                        <div
                          className={`max-w-md px-3 py-2 rounded-lg relative ${
                            isOwnMessage
                              ? `bg-green-500 text-white rounded-br-none ${
                                  isPending ? "opacity-70" : ""
                                }`
                              : "bg-white text-gray-900 rounded-bl-none shadow-sm"
                          }`}
                        >
                          <div className="break-words">{msg.message}</div>
                          <div
                            className={`text-xs mt-1 ${
                              isOwnMessage ? "text-green-100" : "text-gray-500"
                            } flex items-center justify-end gap-1`}
                          >
                            <span>{formatTime(msg.createdAt)}</span>
                            {isOwnMessage && (
                              <>
                                {isPending ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
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

              {/* Typing indicator */}
              {isUserTyping && (
                <div className="flex justify-start mb-2">
                  <div className="bg-white px-3 py-2 rounded-lg rounded-bl-none shadow-sm">
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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

        <div className="px-4 py-2 bg-gray-100">
          <div className="flex items-end gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 mb-1">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
            <div className="flex-1">
              <input
                type="text"
                placeholder={
                  !isConnected
                    ? "Connecting..."
                    : !selectedUser
                    ? "Select a chat"
                    : "Type a message"
                }
                value={message}
                onChange={handleMessageChange}
                onKeyDown={handleKeyDown}
                disabled={!isConnected || !selectedUser}
                className="w-full px-3 py-2 bg-white rounded-lg border-0 focus:outline-none text-sm disabled:bg-gray-200 disabled:text-gray-500"
                style={{ minHeight: "40px" }}
              />
            </div>
            {message.trim() ? (
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !selectedUser}
                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full transition-colors ml-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            ) : (
              <button
                disabled={!isConnected || !selectedUser}
                className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full transition-colors ml-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Content;
