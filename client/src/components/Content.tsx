import { useState, useEffect } from "react";
import { Message, getMessages, sendMessage } from "../utils/users.util";

interface ContentProps {
  selectedUser: { id: number; name: string; avatar: string | null } | null;
}

function Content({ selectedUser }: ContentProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages();
    }
  }, [selectedUser]);

  const fetchMessages = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      const fetchedMessages = await getMessages(selectedUser.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedUser) {
    return <div className="p-4">Select a user to start chatting</div>;
  }

  const handleSendMessage = async () => {
    if (message.trim() && !sending) {
      try {
        setSending(true);
        const newMessage = await sendMessage(selectedUser.id, message.trim());
        setMessages(prev => [...prev, newMessage]);
        setMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
        alert("Failed to send message. Please try again.");
      } finally {
        setSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3">
            {selectedUser.avatar ? (
              <img
                src={selectedUser.avatar}
                alt={selectedUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-white font-medium">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h2>
            <p className="text-sm text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-center mb-6">
              <div className="bg-yellow-200 px-3 py-2 rounded-lg max-w-md text-center mb-4">
                <div className="flex items-start gap-2 text-amber-800 text-xs">
                  <span>Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Click to learn more</span>
                </div>
              </div>
              <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 shadow-sm border border-gray-200">
                Today
              </span>
            </div>
            <div className="text-center text-gray-500 text-sm">
              No conversation yet. Start a new chat with {selectedUser.name}.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.messageId}
                className={`flex ${msg.sender.id === selectedUser.id ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.sender.id === selectedUser.id
                      ? 'bg-white text-gray-900'
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender.id === selectedUser.id ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-2 bg-gray-100">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Content;
