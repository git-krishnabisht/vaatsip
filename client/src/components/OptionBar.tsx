import { MessageSquare, Settings, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react";

function OptionBar() {
  const { user, signout } = useAuth();
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch user details with avatar
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:50136/api/users/user-details/${user.id}`,
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
        console.error("Failed to fetch user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user?.id]);

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  // Don't render on mobile - it's handled by mobile header
  if (isMobile) {
    return null;
  }

  return (
    <div className="h-full w-16 xl:w-20 flex flex-col justify-between items-center p-2 sm:p-3 bg-white border-r border-gray-100 sm:border-r-2 flex-shrink-0">
      {/* Top Section */}
      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        {/* Navigation Items */}
        <div className="relative group">
          <button className="flex items-center justify-center p-2 sm:p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 w-10 h-10 sm:w-12 sm:h-12 xl:w-14 xl:h-14">
            <MessageSquare
              size={18}
              strokeWidth={2.5}
              className="sm:w-5 sm:h-5 xl:w-6 xl:h-6"
            />
            <span className="absolute left-full ml-3 sm:ml-4 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 font-medium pointer-events-none">
              Chats
            </span>
            {/* Active indicator */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 sm:w-1 h-6 sm:h-8 bg-blue-600 rounded-r-full"></div>
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col items-center space-y-2 sm:space-y-3">
        <div className="relative group">
          <button className="flex items-center justify-center p-2 sm:p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-all duration-200 w-10 h-10 sm:w-12 sm:h-12 xl:w-14 xl:h-14">
            <Settings
              size={18}
              strokeWidth={2}
              className="sm:w-5 sm:h-5 xl:w-6 xl:h-6"
            />
            <span className="absolute left-full ml-3 sm:ml-4 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white text-xs sm:text-sm rounded-md sm:rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-xl z-50 font-medium pointer-events-none">
              Settings
            </span>
          </button>
        </div>

        {/* User Profile - Fixed hover area */}
        <div className="relative">
          <button
            className="flex items-center justify-center p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl transition-all duration-200 w-10 h-10 sm:w-12 sm:h-12 xl:w-14 xl:h-14"
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 bg-gray-200 rounded-full animate-pulse"></div>
            ) : userAvatar ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-full overflow-hidden ring-1 sm:ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200">
                <img
                  src={userAvatar}
                  alt={user?.name || "Profile"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs hidden">
                  {getUserInitials(user?.name || "")}
                </div>
              </div>
            ) : (
              <div className="w-6 h-6 sm:w-8 sm:h-8 xl:w-10 xl:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-1 sm:ring-2 ring-blue-100 hover:ring-blue-200 transition-all duration-200">
                {getUserInitials(user?.name || "")}
              </div>
            )}
          </button>

          {/* Profile dropdown - Controlled visibility */}
          <div
            className={`absolute left-full ml-3 sm:ml-4 bottom-0 min-w-56 sm:min-w-64 bg-white rounded-xl shadow-2xl border border-gray-100 sm:border-2 transition-all duration-200 z-[60] overflow-hidden ${
              showProfileDropdown
                ? "opacity-100 visible"
                : "opacity-0 invisible"
            }`}
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
            style={{
              transform: "translateY(-10px)", // Move it up slightly to avoid sidebar overlap
            }}
          >
            <div className="p-3 sm:p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2 sm:gap-3">
                {loading ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full animate-pulse"></div>
                ) : userAvatar ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden ring-1 sm:ring-2 ring-white shadow-md">
                    <img
                      src={userAvatar}
                      alt={user?.name || "Profile"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold hidden">
                      {getUserInitials(user?.name || "")}
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold ring-1 sm:ring-2 ring-white shadow-md">
                    {getUserInitials(user?.name || "")}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>

            <div className="py-1 sm:py-2">
              <button className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-gray-700">
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                Profile
              </button>
              <hr className="my-1 sm:my-2 border-gray-200" />
              <button
                onClick={signout}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-red-50 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-red-600"
              >
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4"
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
