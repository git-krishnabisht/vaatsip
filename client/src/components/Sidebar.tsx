import { useEffect, useState, useCallback } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Search, MessageCircle, X } from "lucide-react";

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
  isVisible?: boolean;
  onClose?: () => void;
}

function Sidebar({ onUserClick, isVisible = true, onClose }: SidebarProps) {
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

        const sortedMessages = messages.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastMessage = sortedMessages[0];

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

  // Function to update conversation data when new message arrives
  const updateConversationData = useCallback(
    (newMessage: any) => {
      if (!newMessage) return;

      const otherUserId =
        newMessage.senderId === user?.id
          ? newMessage.receiverId
          : newMessage.senderId;

      setConversations((prev) => {
        const updated = new Map(prev);
        const current = updated.get(otherUserId) || {
          userId: otherUserId,
          unreadCount: 0,
        };

        updated.set(otherUserId, {
          ...current,
          lastMessage: {
            message: newMessage.message,
            createdAt: newMessage.createdAt,
            senderId: newMessage.senderId,
          },
        });

        return updated;
      });
    },
    [user?.id]
  );

  // Expose update function for parent component
  useEffect(() => {
    if (window.updateSidebarConversation) return;
    window.updateSidebarConversation = updateConversationData;

    return () => {
      delete window.updateSidebarConversation;
    };
  }, [updateConversationData]);

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
      onClose?.(); // Close mobile sidebar
      setTimeout(() => {
        navigate(`/u/${clickedUser.id}`);
      }, 0);
    },
    [onUserClick, navigate, onClose]
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

  const truncateMessage = (message: string, maxLength: number = 25) => {
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
      const conversationA = conversations.get(a.id);
      const conversationB = conversations.get(b.id);

      const timeA = conversationA?.lastMessage?.createdAt
        ? new Date(conversationA.lastMessage.createdAt).getTime()
        : 0;
      const timeB = conversationB?.lastMessage?.createdAt
        ? new Date(conversationB.lastMessage.createdAt).getTime()
        : 0;

      if (timeA && timeB) {
        return timeB - timeA;
      }

      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      return a.name.localeCompare(b.name);
    });

  if (loading) {
    return (
      <div
        className={`flex flex-col h-full bg-white w-full transition-transform duration-300 ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header */}
        <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <div className="w-12 sm:w-16 lg:w-20 h-4 sm:h-6 lg:h-7 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="w-full h-8 sm:h-9 lg:h-10 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 border-2 sm:border-3 border-blue-600 border-t-transparent"></div>
            <div className="text-gray-500 text-xs sm:text-sm font-medium">
              Loading chats...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col h-full bg-white w-full transition-transform duration-300 ${
          isVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile header */}
        <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Chats</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 border-b border-gray-200">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-4">
            Chats
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4 lg:p-6">
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
            <div className="text-red-600 text-xs sm:text-sm font-medium mb-3">
              {error}
            </div>
            <button
              onClick={handleRetry}
              className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-150"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-white w-full min-w-0 transition-transform duration-300 ${
        isVisible ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Mobile header */}
      <div className="flex sm:hidden items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Chats</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Header Section */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 border-b border-gray-200 flex-shrink-0">
        <div className="hidden sm:flex items-center justify-between mb-3 lg:mb-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
            Chats
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-gray-50 border border-transparent rounded-lg sm:rounded-xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all duration-200 text-sm font-medium"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3 lg:mt-4">
          <button className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-150 text-xs font-bold">
            <MessageCircle className="w-3 h-3 lg:w-4 lg:h-4" />
            <span className="hidden xs:inline">All</span>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-xs sm:text-sm font-medium">
                {searchQuery ? "No chats found" : "No conversations yet"}
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 text-xs sm:text-sm font-medium hover:underline mt-2"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-1 sm:py-2">
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
                  className={`relative mx-1.5 sm:mx-2 mb-0.5 sm:mb-1 px-2.5 sm:px-3 lg:px-4 py-2.5 sm:py-3 lg:py-4 cursor-pointer rounded-lg sm:rounded-xl transition-all duration-150 group hover:bg-gray-50 active:bg-gray-100 ${
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
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 sm:w-1 h-6 sm:h-8 lg:h-12 bg-blue-600 rounded-r-full"></div>
                  )}

                  <div className="flex items-center">
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden flex-shrink-0 mr-2.5 sm:mr-3 lg:mr-4 ring-1 sm:ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200">
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
                        className={`w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm lg:text-lg ${
                          u.avatar ? "hidden" : ""
                        }`}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1 lg:mb-2">
                        <h3
                          className={`text-sm sm:text-base font-bold truncate ${
                            isSelected ? "text-blue-900" : "text-gray-900"
                          } group-hover:text-blue-700 transition-colors`}
                        >
                          {u.name}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2">
                          {lastMessageTime && (
                            <span className="text-xs text-gray-500 font-medium flex-shrink-0">
                              {lastMessageTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-xs sm:text-sm text-gray-600 truncate font-medium flex-1">
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
