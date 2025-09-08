import { useEffect, useState, useCallback } from "react";
import Content from "../components/Content";
import { useParams } from "react-router-dom";
import OptionBar from "../components/OptionBar";
import Sidebar from "../components/Sidebar";
import { useUserDetails } from "../contexts/UserDetailsProvider";
import { useMessages } from "../hooks/useMessages";
import { useAuth } from "../contexts/AuthContext";
import { getUsers } from "../utils/users.util";
import type { Message } from "../models/Messages";
import type { User } from "../utils/users.util";
import {
  MessageSquare,
  Shield,
  Smartphone,
  Globe,
  Menu,
  ArrowLeft,
} from "lucide-react";

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
      {/* Main illustration */}
      <div className="relative mb-8 sm:mb-10 lg:mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 shadow-xl sm:shadow-2xl border border-gray-200">
          <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto mb-6 sm:mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
            <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare
                className="w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-white"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4">
              Vaatsip Web
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-xs sm:max-w-md leading-relaxed font-medium">
              Connect with friends and family instantly. Send messages, share
              moments, and stay close.
            </p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 lg:mb-12 max-w-4xl w-full">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <Shield
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              strokeWidth={2}
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            End-to-End Encrypted
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Your messages are secured with industry-leading encryption.
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <Smartphone
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              strokeWidth={2}
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            Cross-Platform
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Access your conversations from any device, anywhere.
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4">
            <Globe
              className="w-5 h-5 sm:w-6 sm:h-6 text-white"
              strokeWidth={2}
            />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            Always Connected
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Real-time messaging that keeps you in touch instantly.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center">
        <div className="bg-white rounded-xl sm:rounded-2xl px-6 sm:px-8 py-5 sm:py-6 shadow-lg border border-gray-200 inline-block">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
            Ready to start chatting?
          </h2>
          <p className="text-gray-600 font-medium mb-3 sm:mb-4 text-sm sm:text-base">
            Select a conversation from the sidebar to begin messaging.
          </p>
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold">
              Choose a chat to get started
            </span>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const { userDetails, setUserDetails } = useUserDetails();
  const { messages, loading: messagesLoading, error } = useMessages();
  const { user: currentUser } = useAuth();
  const [allMessages, setAllMessages] = useState<Message[]>(messages);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
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

  // Pre-load all users to avoid async loading when switching
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const users = await getUsers();
        setAllUsers(users);
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    };

    loadAllUsers();
  }, []);

  useEffect(() => {
    setAllMessages(messages);
  }, [messages]);

  // Handle user selection from URL parameter
  useEffect(() => {
    if (receiver_id && allUsers.length > 0) {
      const userId = parseInt(receiver_id);
      const selectedUser = allUsers.find((u) => u.id === userId);

      if (selectedUser) {
        // Only update if it's a different user to prevent unnecessary re-renders
        if (!userDetails || userDetails.id !== selectedUser.id) {
          setUserDetails(selectedUser);
        }
      } else {
        console.warn(`User with ID ${userId} not found`);
        setUserDetails(null);
      }

      setIsLoadingUser(false);
      // Hide sidebar on mobile when user is selected
      if (isMobile) {
        setIsSidebarVisible(false);
      }
    } else if (!receiver_id) {
      // Clear user details when no receiver_id
      setUserDetails(null);
      setIsLoadingUser(false);
    } else if (receiver_id && allUsers.length === 0) {
      // Still loading users
      setIsLoadingUser(true);
    }
  }, [receiver_id, allUsers, userDetails, setUserDetails, isMobile]);

  const handleMessagesUpdate = useCallback((updatedMessages: Message[]) => {
    setAllMessages(updatedMessages);
  }, []);

  const handleUserClick = useCallback(
    (user: User) => {
      // Immediately set the user details to prevent navbar flashing
      // This happens before navigation, so navbar shows correct user immediately
      setUserDetails(user);
      setIsLoadingUser(false);
    },
    [setUserDetails]
  );

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const closeSidebar = () => {
    setIsSidebarVisible(false);
  };

  return (
    <div className="flex flex-row h-screen bg-gray-50 relative">
      {/* Option Bar */}
      <div className="hidden sm:block sm:basis-16 lg:basis-20 shrink-0 shadow-sm z-30">
        <OptionBar />
      </div>

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            {receiver_id ? (
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">
              {receiver_id && userDetails ? userDetails.name : "Vaatsip"}
            </h1>
          </div>

          {!receiver_id && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        ${
          isMobile
            ? "fixed top-0 left-0 h-full w-80 z-50"
            : "hidden sm:block sm:basis-80 md:basis-96 lg:basis-[400px] shrink-0"
        } shadow-sm
      `}
      >
        <Sidebar
          onUserClick={handleUserClick}
          isVisible={isMobile ? isSidebarVisible : true}
          onClose={closeSidebar}
        />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col shadow-sm ${isMobile ? "pt-14" : ""}`}
      >
        {receiver_id ? (
          <div className="flex-1 overflow-hidden">
            <Content
              selectedUser={userDetails}
              messages={allMessages}
              loading={messagesLoading}
              error={error}
              currentUser={currentUser?.id}
              onMessagesUpdate={handleMessagesUpdate}
              isLoadingUser={isLoadingUser}
            />
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Mobile Bottom Navigation - Optional */}
      {isMobile && receiver_id && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-center z-30 shadow-lg">
          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <span className="text-xs text-gray-600 font-medium">Chats</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
