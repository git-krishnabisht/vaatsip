import type { User } from "../utils/users.util";
import { useState, useEffect } from "react";

interface NavProps {
  selectedUser: User | null;
  isOnline?: boolean;
  isTyping?: boolean;
  isLoading?: boolean;
}

function Navbar({ selectedUser, isOnline, isTyping, isLoading }: NavProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);

  // Update current user and fetch avatar when selectedUser changes
  useEffect(() => {
    if (selectedUser && selectedUser.id !== currentUser?.id) {
      setCurrentUser(selectedUser);
      setUserAvatar(null);
      setIsLoadingAvatar(true);

      // Fetch user avatar
      const fetchUserAvatar = async () => {
        try {
          const response = await fetch(
            `http://localhost:50136/api/users/user-details/${selectedUser.id}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.details?.avatar) {
              setUserAvatar(data.details.avatar);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user avatar:", error);
        } finally {
          setIsLoadingAvatar(false);
        }
      };

      fetchUserAvatar();
    }
  }, [selectedUser, currentUser]);

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b-2 border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex flex-col gap-2">
            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-20 bg-white shadow-sm border-b-2 border-gray-100">
        <p className="text-gray-500 text-sm font-medium">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b-2 border-gray-100">
      <div className="flex items-center gap-4 hover:cursor-pointer group">
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-200">
          {isLoadingAvatar ? (
            <div className="w-full h-full bg-gray-200 animate-pulse"></div>
          ) : userAvatar ? (
            <>
              <img
                src={userAvatar}
                alt={currentUser.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {getUserInitials(currentUser.name)}
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {getUserInitials(currentUser.name)}
            </div>
          )}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-64 group-hover:text-blue-600 transition-colors">
            {currentUser.name}
          </h2>
          <div className="flex items-center gap-2">
            {isTyping ? (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-blue-600">
                  typing...
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                ></div>
                <span
                  className={`text-sm font-medium ${
                    isOnline ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isOnline ? "online" : "last seen recently"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-150 group"
          aria-label="More options"
        >
          <svg
            className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Navbar;
