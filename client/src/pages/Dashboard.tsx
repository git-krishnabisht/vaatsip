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
import { MessageSquare, Shield, Smartphone, Globe } from "lucide-react";

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      {/* Main illustration */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        <div className="relative bg-white rounded-3xl p-12 shadow-2xl border border-gray-200">
          <div className="w-32 h-32 mx-auto mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-20"></div>
            <div className="relative w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageSquare
                className="w-16 h-16 text-white"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Vaatsip Web
            </h1>
            <p className="text-gray-600 text-lg max-w-md leading-relaxed font-medium">
              Connect with friends and family instantly. Send messages, share
              moments, and stay close.
            </p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl w-full">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            End-to-End Encrypted
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Your messages are secured with industry-leading encryption.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Cross-Platform
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Access your conversations from any device, anywhere.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
            <Globe className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Always Connected
          </h3>
          <p className="text-gray-600 text-sm font-medium">
            Real-time messaging that keeps you in touch instantly.
          </p>
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center">
        <div className="bg-white rounded-2xl px-8 py-6 shadow-lg border border-gray-200 inline-block">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Ready to start chatting?
          </h2>
          <p className="text-gray-600 font-medium mb-4">
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

      {/* Security notice */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 ">
        <div className="flex justify-center items-center gap-3 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-gray-200">
          <Shield className="w-5 h-5 text-green-600" strokeWidth={2} />
          <span className="text-sm font-medium text-gray-700">
            Your privacy is protected with end-to-end encryption
          </span>
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
    } else if (!receiver_id) {
      // Clear user details when no receiver_id
      setUserDetails(null);
      setIsLoadingUser(false);
    } else if (receiver_id && allUsers.length === 0) {
      // Still loading users
      setIsLoadingUser(true);
    }
  }, [receiver_id, allUsers, userDetails, setUserDetails]);

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

  return (
    <div className="flex flex-row h-screen bg-gray-50">
      {/* Option Bar */}
      <div className="basis-16 lg:basis-20 shrink-0 shadow-sm">
        <OptionBar />
      </div>

      {/* Sidebar */}
      <div className="hidden sm:block sm:basis-80 md:basis-96 lg:basis-[400px] shrink-0 shadow-sm">
        <Sidebar onUserClick={handleUserClick} />
      </div>

      {/* Main Content */}
      {receiver_id ? (
        <div className="flex-1 flex flex-col shadow-sm">
          <div className="flex-1 overflow-auto">
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
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

export default Dashboard;
