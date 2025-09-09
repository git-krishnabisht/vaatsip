import { useEffect, useState, useMemo, useCallback } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Search, MessageCircle } from "lucide-react";
import type { Message } from "../models/Messages";

interface ConversationData {
  user: User;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: number;
  };
}

interface SidebarProps {
  onUserClick: (user: User) => void;
  recentMessage?: Message | null;
  onConversationUpdate?: (conversationId: number) => void;
}

function Sidebar({
  onUserClick,
  recentMessage,
  onConversationUpdate,
}: SidebarProps) {
  const [_users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const baseURL = import.meta.env.VITE_API_BASE;

  // Fetch users and conversation data
  const fetchConversationData = useCallback(async () => {
    try {
      setLoading(true);
      const allUsers = await getUsers();
      const filteredUsers = allUsers.filter((u) => u.id !== currentUser?.id);
      setUsers(filteredUsers);

      const conversationPromises = filteredUsers.map(async (user) => {
        try {
          const response = await fetch(
            `${baseURL}/comm/get-messages/${user.id}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (response.ok) {
            const messages = await response.json();
            const lastMessage =
              messages.length > 0 ? messages[messages.length - 1] : null;

            return {
              user,
              lastMessage: lastMessage
                ? {
                    content: lastMessage.message || "",
                    timestamp: lastMessage.createdAt,
                    senderId: lastMessage.senderId,
                  }
                : undefined,
            };
          } else {
            return { user, lastMessage: undefined };
          }
        } catch (error) {
          console.error(`Failed to fetch messages for user ${user.id}:`, error);
          return { user, lastMessage: undefined };
        }
      });

      const conversationData = await Promise.all(conversationPromises);
      setConversations(conversationData);
    } catch (error) {
      console.error("Failed to fetch conversation data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchConversationData();
    }
  }, [currentUser?.id, fetchConversationData]);

  // Handle real-time message updates
  useEffect(() => {
    if (!recentMessage || !currentUser?.id) return;

    const { senderId, receiverId, message, createdAt } = recentMessage;
    const otherUserId = senderId === currentUser.id ? receiverId : senderId;

    setConversations((prevConversations) => {
      const updatedConversations = prevConversations.map((conv) => {
        if (conv.user.id === otherUserId) {
          return {
            ...conv,
            lastMessage: {
              content: message || "",
              timestamp: createdAt,
              senderId,
            },
          };
        }
        return conv;
      });

      return updatedConversations.sort((a, b) => {
        const aTime = a.lastMessage?.timestamp
          ? new Date(a.lastMessage.timestamp).getTime()
          : 0;
        const bTime = b.lastMessage?.timestamp
          ? new Date(b.lastMessage.timestamp).getTime()
          : 0;
        return bTime - aTime;
      });
    });

    if (onConversationUpdate) {
      onConversationUpdate(otherUserId);
    }
  }, [recentMessage, currentUser?.id, receiver_id, onConversationUpdate]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    return conversations.filter(
      (conversation) =>
        conversation.user.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage?.content || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const sortedConversations = useMemo(() => {
    return filteredConversations.sort((a, b) => {
      const aTime = a.lastMessage?.timestamp
        ? new Date(a.lastMessage.timestamp).getTime()
        : 0;
      const bTime = b.lastMessage?.timestamp
        ? new Date(b.lastMessage.timestamp).getTime()
        : 0;
      return bTime - aTime;
    });
  }, [filteredConversations]);

  const handleUserClick = (clickedUser: User) => {
    onUserClick(clickedUser);
    navigate(`/u/${clickedUser.id}`);
  };

  const formatLastMessage = (conversation: ConversationData): string => {
    if (!conversation.lastMessage) return "No messages yet";

    const { content, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === currentUser?.id;
    const prefix = isOwnMessage ? "You: " : "";
    const maxLength = 32;

    if (!content.trim()) {
      return isOwnMessage ? "You sent a message" : "Received a message";
    }

    const fullMessage = `${prefix}${content}`;
    return fullMessage.length > maxLength
      ? fullMessage.substring(0, maxLength) + "..."
      : fullMessage;
  };

  const formatTime = (timestamp?: string): string => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800 mb-4">Vaatsip</h1>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search conversations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : sortedConversations.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center justify-center h-32 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              No conversations found for "{searchQuery}"
            </p>
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm text-center">
              No conversations yet
            </p>
            <p className="text-gray-400 text-xs text-center mt-1">
              Start a new chat to begin messaging
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedConversations.map((conversation) => {
              const isSelected =
                receiver_id && parseInt(receiver_id) === conversation.user.id;
              const lastMessageTime = conversation.lastMessage?.timestamp;

              return (
                <div
                  key={conversation.user.id}
                  className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-gray-50 relative ${
                    isSelected ? "bg-blue-50 hover:bg-blue-100" : ""
                  }`}
                  onClick={() => handleUserClick(conversation.user)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mr-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
                      {conversation.user.avatar ? (
                        <img
                          src={conversation.user.avatar}
                          alt={conversation.user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {conversation.user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-sm font-medium truncate ${
                          isSelected ? "text-blue-800" : "text-gray-900"
                        }`}
                      >
                        {conversation.user.name}
                      </h3>
                      {lastMessageTime && (
                        <span className="text-xs flex-shrink-0 text-gray-500">
                          {formatTime(lastMessageTime)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm truncate pr-2 text-gray-500">
                        {formatLastMessage(conversation)}
                      </p>
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
