import {
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function OptionBar() {
  const { user, signout } = useAuth();

  return (
    <div className="h-full flex flex-col justify-between items-center p-3 bg-white border-r-2 border-gray-100">
      {/* Top Section */}
      <div className="flex flex-col items-center space-y-2">
        {/* Navigation Items */}
        <button className="relative flex items-center justify-center p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 group w-full">
          <MessageSquare size={22} strokeWidth={2.5} />
          <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 font-medium">
            Chats
          </span>
          {/* Active indicator */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
        </button>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-2">
        <button className="relative flex items-center justify-center p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all duration-200 group w-full">
          <Settings size={22} strokeWidth={2} />
          <span className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 font-medium">
            Settings
          </span>
        </button>

        {/* User Profile */}
        <div className="relative group">
          <button className="flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 w-full">
            {user?.name ? (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-100">
                {user.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User size={22} strokeWidth={2} />
            )}
          </button>

          {/* Profile dropdown */}
          <div className="absolute left-full ml-3 bottom-0 min-w-48 bg-white rounded-xl shadow-2xl border-2 border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-2">
              <button className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm font-medium text-gray-700">
                <User className="w-4 h-4" />
                Profile
              </button>
              <hr className="my-2 border-gray-200" />
              <button
                onClick={signout}
                className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-3 text-sm font-medium text-red-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4M11 9l4-4m0 0l4 4m-4-4v11"
                  />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptionBar;
