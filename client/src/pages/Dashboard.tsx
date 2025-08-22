import Content from "../components/Content";
import OptionBar from "../components/OptionBar";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useUserDetails } from "../contexts/UserDetailsProvider";

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="mb-8">
        <svg
          className="w-80 h-80 text-gray-300"
          viewBox="0 0 320 320"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="160" cy="160" r="120" fill="currentColor" opacity="0.1" />
          <path
            d="M80 120h160c11 0 20 9 20 20v80c0 11-9 20-20 20H120l-20 20v-20H80c-11 0-20-9-20-20v-80c0-11 9-20 20-20z"
            fill="currentColor"
            opacity="0.2"
          />
          <circle cx="120" cy="180" r="8" fill="currentColor" opacity="0.3" />
          <circle cx="160" cy="180" r="8" fill="currentColor" opacity="0.3" />
          <circle cx="200" cy="180" r="8" fill="currentColor" opacity="0.3" />

          <rect
            x="200"
            y="80"
            width="60"
            height="40"
            rx="8"
            fill="currentColor"
            opacity="0.15"
          />
          <rect
            x="210"
            y="90"
            width="40"
            height="20"
            rx="2"
            fill="currentColor"
            opacity="0.2"
          />

          <path
            d="M180 160 L200 120"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
            strokeDasharray="5,5"
          />
        </svg>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-3xl font-light text-gray-700 mb-4">Vaatsip Web</h1>
        <p className="text-gray-500 text-lg max-w-md leading-relaxed">
          Send and receive messages without keeping your phone online.
        </p>
      </div>

      <div className="flex items-center gap-2 text-gray-400 text-sm mt-12">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        <span>Your personal messages are end-to-end encrypted</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const { userDetails, setUserDetails } = useUserDetails();

  return (
    <div className="flex flex-row h-screen">
      <div className="basis-10 md:basis-14 lg:basis-16 border-r border-black shrink-0 bg-gray-100">
        <OptionBar />
      </div>
      <div className="hidden sm:block sm:basis-60 md:basis-80 lg:basis-100 border-r border-black shrink-0">
        <Sidebar onUserClick={setUserDetails} />
      </div>
      {userDetails ? (
        <div className="flex-1 flex flex-col">
          <div className="border-b border-black bg-gray-100">
            <Navbar selectedUser={userDetails} />
          </div>
          <div className="flex-1 overflow-auto">
            <Content selectedUser={userDetails} />
          </div>
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default Dashboard;
