import { useState } from "react";
import {
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function OptionBar() {
  const [activeTab, setActiveTab] = useState("chats");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, signout } = useAuth();

  const handleSignOut = async () => {
    try {
      await signout();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between items-center p-3 bg-white border-r border-gray-200 relative">
      {/* Top Section */}
      <div className="flex flex-col space-y-2">
        {/* Menu Button (Mobile) */}
        <button className="md:hidden relative flex items-center justify-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group">
          <Menu size={20} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Menu
          </span>
        </button>

        {/* Chats Tab */}
        <button
          onClick={() => setActiveTab("chats")}
          className={`relative flex items-center justify-center p-3 rounded-lg transition-all duration-200 group ${
            activeTab === "chats"
              ? "bg-blue-100 text-blue-600 shadow-sm"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <MessageSquare size={20} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Chats
          </span>
          {activeTab === "chats" && (
            <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-l"></div>
          )}
        </button>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col space-y-2">
        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="relative flex items-center justify-center p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            )}
            <span className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Profile
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute bottom-full left-full ml-2 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.id ? `ID: ${user.id}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <User className="w-4 h-4" />
                    <span>Edit profile</span>
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3">
                    <Settings className="w-4 h-4" />
                    <span>Preferences</span>
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleSignOut}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-3"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OptionBar;
