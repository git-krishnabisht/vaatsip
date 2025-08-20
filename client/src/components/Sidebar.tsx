import { useEffect, useState } from "react";
import { getUsers, type User } from "../utils/get-users.util";

function Sidebar() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      let _users = await getUsers();
      setUsers(_users);
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase()
  );

  return (<>
    <div className="flex flex-col h-full">

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium">Chats</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredUsers.map((user) => (
          <div key={user.id} className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100">


            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 mr-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>


            <div className="flex-1 min-w-0">

              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {user.name}
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
  </>);
}

export default Sidebar;
