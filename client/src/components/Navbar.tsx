import type { User } from "../utils/users.util";

interface NavProps {
  selectedUser: User | null;
  isOnline?: boolean;
  isTyping?: boolean;
  isLoading?: boolean;
}

function Navbar({ selectedUser, isOnline, isTyping, isLoading }: NavProps) {
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

  if (!selectedUser) {
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
          {selectedUser.avatar ? (
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                target.nextElementSibling?.classList.remove("hidden");
              }}
            />
          ) : null}

          <div
            className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg ${
              selectedUser.avatar ? "hidden" : ""
            }`}
          >
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>

          {/* Online status indicator */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 border-3 border-white rounded-full transition-all duration-200 ${
              isOnline ? "bg-green-500 shadow-lg" : "bg-gray-400"
            }`}
          ></div>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900 truncate max-w-64 group-hover:text-blue-600 transition-colors">
            {selectedUser.name}
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
          aria-label="Video call"
        >
          <svg
            className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        <button
          className="p-3 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-all duration-150 group"
          aria-label="Voice call"
        >
          <svg
            className="w-5 h-5 text-gray-600 group-hover:text-green-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </button>

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
