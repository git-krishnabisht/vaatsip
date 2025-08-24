import { useEffect, useState } from "react";
import { getUsers, type User } from "../utils/users.util";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
// import { useMessages } from "../utils/useMessages";

interface SidebarProps {
  onUserClick: (user: User) => void;
}

function Sidebar({ onUserClick }: SidebarProps) {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  // const { messages } = useMessages();
  const { user } = useAuth();

  // const [sidebarInfo, setSidebarInfo] = useState({
  //   lastTime: "",
  //   lastMessage: ""
  // });

  useEffect(() => {
    async function fetchUsers() {
      const _users = await getUsers();
      setUsers(_users);
    }
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-5">
        <h1 className="text-xl font-medium">Chats</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.filter((u)=> u.id != user?.id).map((u) => (
          <div
            key={u.id}
            className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
            onClick={() => {
              onUserClick(u);
              navigate(`/u/${u.id}`);
            }}
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
                <h3 className="text-sm font-medium text-gray-900 truncate">
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
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
