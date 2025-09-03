import { MessageSquare, Settings, User } from "lucide-react";

function OptionBar() {
  return (
    <div className="h-full flex flex-col justify-between items-center p-3">
      <div>
        <button className="relative flex items-center justify-center p-3 text-gray-700 hover:bg-gray-200 rounded-full transition-colors group hover:cursor-pointer">
          <MessageSquare size={20} />
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            chats
          </span>
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div>
          <button className="relative flex items-center justify-center p-3 text-gray-700 hover:bg-gray-200 rounded-full transition-colors group hover:cursor-pointer">
            <Settings size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              settings
            </span>
          </button>
        </div>

        <div>
          <button className="relative flex items-center justify-center p-3 text-gray-700 hover:bg-gray-200 rounded-full transition-colors group hover:cursor-pointer">
            <User size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              profile
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default OptionBar;
