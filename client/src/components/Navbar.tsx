import type { User } from "../utils/users.util";

interface NavProps {
  selectedUser: User | null;
  isOnline?: boolean;
  isTyping?: boolean;
  isLoading?: boolean; // Add loading state prop
}

function Navbar({ selectedUser, isOnline, isTyping, isLoading }: NavProps) {
  // Show loading state while switching users OR when explicitly loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="flex flex-col gap-2">
            <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-16 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="p-2">
          <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-16">
        <p className="text-gray-500 text-sm">
          Select a chat to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3 hover:cursor-pointer">
        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {selectedUser.avatar ? (
            <img
              src={selectedUser.avatar}
              alt={selectedUser.name}
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
            className={`w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium text-sm ${
              selectedUser.avatar ? "hidden" : ""
            }`}
          >
            {selectedUser.name.charAt(0).toUpperCase()}
          </div>

          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <h2 className="text-base font-medium text-gray-900 truncate max-w-48">
            {selectedUser.name}
          </h2>
          <p className="text-xs text-gray-500 truncate">
            {isTyping ? (
              <span className="text-green-600 font-medium">typing...</span>
            ) : isOnline ? (
              <span className="text-green-600">online</span>
            ) : (
              "last seen recently"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="p-2 hover:bg-gray-200 cursor-pointer rounded-full transition-colors"
          aria-label="More options"
        >
          <svg
            className="w-5 h-5 text-gray-600"
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
