import { useState } from "react";
import type { User } from "../utils/users.util";
import type { Message } from "../models/Messages";
import Navbar from "./Navbar";

interface ContentProps {
  selectedUser: User | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  currentUser?: number;
}

function Content({
  selectedUser,
  messages,
  loading,
  error,
  currentUser,
}: ContentProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

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

  const messageArray = Array.isArray(messages) ? messages : [];

  const groupedMessages = messageArray.reduce(
    (groups: { [key: string]: Message[] }, message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {}
  );

  return (
    <div className="flex flex-col h-full">

      <div className="sticky top-0 z-10 border-b border-black bg-gray-100">
        <Navbar selectedUser={selectedUser} />
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
                              ? "bg-green-500 text-white rounded-br-none"
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Input Area */}
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
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2 bg-white rounded-lg border-0 focus:outline-none text-sm"
                style={{ minHeight: "40px" }}
              />
            </div>
            {message.trim() ? (
              <button
                onClick={handleSendMessage}
                className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors ml-2"
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
              <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors ml-2">
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
