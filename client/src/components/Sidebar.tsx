import { useEffect, useState } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  onUserClick: (user: User) => void;
}

function Sidebar({ onUserClick }: SidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const _users = await getUsers();
        setUsers(_users);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  const handleUserClick = (clickedUser: User) => {
    onUserClick(clickedUser);
    navigate(`/u/${clickedUser.id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <h1 className="text-xl font-medium">Chats</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users
          .filter((u) => u.id !== user?.id)
          .map((u) => {
            const isSelected = receiver_id && parseInt(receiver_id) === u.id;

            return (
              <div
                key={u.id}
                className={`flex items-center px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors ${
                  isSelected
                    ? "bg-green-100 hover:bg-green-200"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => handleUserClick(u)}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mr-3">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  )}
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
                      12:34
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      Last message preview...
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Sidebar;
