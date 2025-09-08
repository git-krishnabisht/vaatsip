import { useEffect, useState, useCallback } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  onUserClick: (user: User) => void;
}

function Sidebar({ onUserClick }: SidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const _users = await getUsers();
      setUsers(Array.isArray(_users) ? _users : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserClick = useCallback(
    (clickedUser: User) => {
      // Validate user object
      if (!clickedUser || !clickedUser.id || !clickedUser.name) {
        console.error("Invalid user object:", clickedUser);
        return;
      }

      // Call onUserClick BEFORE navigation to update state immediately
      onUserClick(clickedUser);

      // Small delay to ensure state update happens before navigation
      setTimeout(() => {
        navigate(`/u/${clickedUser.id}`);
      }, 0);
    },
    [onUserClick, navigate]
  );

  const handleRetry = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-5">
          <h1 className="text-xl font-medium">Chats</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-gray-500 text-sm">Loading chats...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-5">
          <h1 className="text-xl font-medium">Chats</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-red-500 text-sm mb-2">{error}</div>
            <button
              onClick={handleRetry}
              className="text-blue-600 text-sm hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u) => {
    // Ensure user has valid properties and is not the current user
    return (
      u &&
      typeof u.id === "number" &&
      typeof u.name === "string" &&
      u.name.trim() &&
      u.id !== user?.id
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <h1 className="text-xl font-medium">Chats</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <div className="text-gray-500 text-sm text-center">
              No other users found
            </div>
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isSelected = receiver_id && parseInt(receiver_id) === u.id;

            return (
              <div
                key={u.id}
                className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                  isSelected ? "bg-green-100 hover:bg-green-200" : ""
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
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mr-3">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={`${u.name}'s avatar`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initial if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}

                  <div
                    className={`w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium ${
                      u.avatar ? "hidden" : ""
                    }`}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-green-800" : "text-gray-900"
                      }`}
                    >
                      {u.name}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {/* You might want to show actual last message time here */}
                      12:34
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {/* You might want to show actual last message preview here */}
                      Last message preview...
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Sidebar;
