import { useState } from "react";
import type { User } from "../utils/users.util";

interface ContentProps {
  selectedUser: User | null;
}

function Content({ selectedUser}: ContentProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100">
      <div className="flex-1 flex flex-col justify-end px-16 py-4">
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-200 px-3 py-2 rounded-lg max-w-md text-center">
            <div className="flex items-start gap-2 text-amber-800 text-xs">
              <span>
                Messages and calls are end-to-end encrypted. Only people in this
                chat can read, listen to, or share them. Click to learn more
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm border border-gray-200">
            Today
          </span>
        </div>

        <div className="text-center text-gray-500 text-sm">
          No conversation yet. Start a new chat with {selectedUser?.name}.
        </div>
      </div>

      <div className="px-4 py-2 bg-gray-100">
        <div className="flex items-end gap-2">
          {/* <button className="p-2 text-gray-500 hover:text-gray-700 mb-1"> */}
          {/*   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"> */}
          {/*     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /> */}
          {/*   </svg> */}
          {/* </button> */}

          <button className="p-2 text-gray-500 hover:text-gray-700 mb-1">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 bg-white rounded-lg border-0 focus:outline-none text-sm"
              style={{ minHeight: "40px" }}
            />
          </div>

          {message.trim() ? (
            <button
              onClick={handleSendMessage}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors ml-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          ) : (
            <button className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors ml-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Content;
