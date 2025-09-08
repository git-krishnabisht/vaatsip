import { useEffect, useState, useCallback } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Search, MessageCircle } from "lucide-react";

interface ConversationData {
  userId: number;
  lastMessage?: {
    message: string;
    createdAt: string;
    senderId: number;
  };
  unreadCount: number;
}

interface SidebarProps {
  onUserClick: (user: User) => void;
}

function Sidebar({ onUserClick }: SidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<
    Map<number, ConversationData>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchConversationData = useCallback(
    async (userId: number): Promise<ConversationData> => {
      try {
        const res = await fetch(
          `http://localhost:50136/api/comm/get-messages/${userId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          if (res.status === 404) {
            // No messages found
            return {
              userId,
              unreadCount: 0,
            };
          }
          throw new Error(`Failed to fetch messages: ${res.status}`);
        }

        const messages = await res.json();

        if (!Array.isArray(messages) || messages.length === 0) {
          return {
            userId,
            unreadCount: 0,
          };
        }

        // Get the latest message
        const sortedMessages = messages.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastMessage = sortedMessages[0];

        // Count unread messages (messages from the other user that we haven't read)
        // Note: You might need to implement a proper "read" status system
        const unreadCount = messages.filter(
          (msg) => msg.senderId === userId && !msg.isRead
        ).length;

        return {
          userId,
          lastMessage: lastMessage
            ? {
                message: lastMessage.message,
                createdAt: lastMessage.createdAt,
                senderId: lastMessage.senderId,
              }
            : undefined,
          unreadCount,
        };
      } catch (error) {
        console.error(
          `Failed to fetch conversation data for user ${userId}:`,
          error
        );
        return {
          userId,
          unreadCount: 0,
        };
      }
    },
    []
  );

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const _users = await getUsers();
      const validUsers = Array.isArray(_users)
        ? _users.filter((u) => {
            return (
              u &&
              typeof u.id === "number" &&
              typeof u.name === "string" &&
              u.name.trim() &&
              u.id !== user?.id
            );
          })
        : [];

      setUsers(validUsers);

      // Fetch conversation data for each user
      const conversationMap = new Map<number, ConversationData>();

      await Promise.all(
        validUsers.map(async (userItem) => {
          const conversationData = await fetchConversationData(userItem.id);
          conversationMap.set(userItem.id, conversationData);
        })
      );

      setConversations(conversationMap);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchConversationData, user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = useCallback(
    (clickedUser: User) => {
      if (!clickedUser || !clickedUser.id || !clickedUser.name) {
        console.error("Invalid user object:", clickedUser);
        return;
      }

      onUserClick(clickedUser);
      setTimeout(() => {
        navigate(`/u/${clickedUser.id}`);
      }, 0);
    },
    [onUserClick, navigate]
  );

  const handleRetry = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff / (1000 * 60));

      if (days > 7) {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else if (days > 0) {
        return `${days}d`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      } else {
        return "now";
      }
    } catch {
      return "";
    }
  };

  const truncateMessage = (message: string, maxLength: number = 35) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  const getMessagePreview = (
    conversation: ConversationData,
    currentUserId?: number
  ) => {
    if (!conversation.lastMessage) {
      return "No messages yet";
    }

    const isOwnMessage = conversation.lastMessage.senderId === currentUserId;
    const prefix = isOwnMessage ? "You: " : "";
    const message = truncateMessage(conversation.lastMessage.message);

    return `${prefix}${message}`;
  };

  const filteredUsers = users
    .filter((u) => {
      return (
        searchQuery === "" ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Sort by last message time (most recent first)
      const conversationA = conversations.get(a.id);
      const conversationB = conversations.get(b.id);

      const timeA = conversationA?.lastMessage?.createdAt
        ? new Date(conversationA.lastMessage.createdAt).getTime()
        : 0;
      const timeB = conversationB?.lastMessage?.createdAt
        ? new Date(conversationB.lastMessage.createdAt).getTime()
        : 0;

      // If both have messages, sort by time
      if (timeA && timeB) {
        return timeB - timeA;
      }

      // If only one has messages, prioritize it
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      // If neither has messages, sort alphabetically
      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-5 border-b-2 border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20 h-7 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
          <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
            <div className="text-gray-500 text-sm font-medium">
              Loading chats...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-6 py-5 border-b-2 border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chats</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
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
            <div className="text-red-600 text-sm font-medium mb-3">{error}</div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Section */}
      <div className="px-6 py-5 border-b-2 border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all duration-200 text-sm font-medium"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4">
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-150 text-xs font-bold">
            <MessageCircle className="w-4 h-4" />
            All
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-sm font-medium">
                {searchQuery ? "No chats found" : "No conversations yet"}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 text-sm font-medium hover:underline mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredUsers.map((u) => {
              const isSelected = receiver_id && parseInt(receiver_id) === u.id;
              const conversation = conversations.get(u.id);
              const messagePreview = getMessagePreview(
                conversation || { userId: u.id, unreadCount: 0 },
                user?.id
              );
              const lastMessageTime = conversation?.lastMessage?.createdAt
                ? formatTime(conversation.lastMessage.createdAt)
                : "";

              return (
                <div
                  key={u.id}
                  className={`relative mx-2 mb-1 px-4 py-4 cursor-pointer rounded-xl transition-all duration-150 group hover:bg-gray-50 active:bg-gray-100 ${
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-100 shadow-sm ring-1 ring-blue-200"
                      : ""
                  }`}
                  onClick={() => handleUserClick(u)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleUserClick(u);
                    }
                  }}
                  aria-label={`Chat with ${u.name}`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-blue-600 rounded-r-full"></div>
                  )}

                  <div className="flex items-center">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 mr-4 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt={`${u.name}'s avatar`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                      ) : null}

                      <div
                        className={`w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg ${
                          u.avatar ? "hidden" : ""
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Online indicator - you can integrate with your online users system */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-3 border-white rounded-full shadow-sm"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className={`text-base font-bold truncate ${
                            isSelected ? "text-blue-900" : "text-gray-900"
                          } group-hover:text-blue-700 transition-colors`}
                        >
                          {u.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {lastMessageTime && (
                            <span className="text-xs text-gray-500 font-medium">
                              {lastMessageTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate font-medium flex-1">
                          {messagePreview}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
