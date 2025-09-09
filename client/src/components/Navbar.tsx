import { useState } from "react";
import type { User } from "../utils/users.util";
import { ArrowLeft } from "lucide-react";

interface NavProps {
  selectedUser: User | null;
  isOnline?: boolean;
  isTyping?: boolean;
}

function Navbar({ selectedUser, isOnline, isTyping }: NavProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-16 bg-gradient-to-r from-gray-50 to-gray-100">
        <p className="text-gray-500 text-sm font-medium">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 relative">
      {/* Left Section - Back button (mobile) + User Info */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {/* Back Button - visible on mobile */}
        <button className="sm:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* User Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Online Indicator */}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-gray-900 truncate">
              {selectedUser.name}
            </h2>
            <div className="flex items-center space-x-1">
              {isTyping ? (
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-0.5">
                    <div
                      className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    typing...
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-1">
                  {isOnline && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  )}
                  <p className="text-xs text-gray-500">
                    {isOnline ? "online" : "last seen recently"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex items-center space-x-1">{/* More Options */}</div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

export default Navbar;
