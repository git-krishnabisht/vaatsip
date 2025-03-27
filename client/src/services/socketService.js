import { create } from "zustand";
import { persist } from "zustand/middleware";
const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : "";
const wsURL = import.meta.env.MODE === "development" 
  ? "ws://localhost:50136" 
  : `ws://${window.location.host}`;

export const socketService = create(
  persist((set, get) => ({
    socket: null,
    message: [],

    initializeSocket: (user) => {
      try {
        if (!user) {
          console.error("User is required to connect to the webSocket");
          return;
        }
        const ws = new WebSocket(`${wsURL}?username=${encodeURIComponent(user)}`);
        set({ socket: ws });
        
        // Add message event handler
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            set((state) => ({ message: [...state.message, data] }));
          }
        };
      } catch (error) {
        console.error("Failed to initializing the webSocket", error);
      }
    },

    connectSocket: () => {
      try {
        const socket = get().socket;
        if (!socket) return;
        
        socket.onopen = () => {
          console.log("Connected to webSocket");
        }
        
        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        }
        
        return;
      } catch (error) {
        console.log("Failed to connect to the webSocket", error);
      }
    },

    disconnectSocket: () => {
      const socket = get().socket;
      if (!socket) return;
      
      socket.onclose = () => {
        console.log("Disconnected from webSocket");
      }
      
      // Actually close the socket
      socket.close();
      set({ socket: null });
    },

    sendMessage: async (message, receiver) => {
      try {
        // First send through socket for real-time delivery
        const socket = get().socket;
        if (socket && socket.readyState === WebSocket.OPEN) {
          const messageToSend = {
            type: 'message',
            message: message.message || '',
            receiver: receiver,
            sender: message.sender || '',
            created_at: message.created_at || new Date().toISOString()
          };
          socket.send(JSON.stringify(messageToSend));
        }
        
        // Then persist via HTTP API
        const formData = new FormData();

        formData.append('message', message.message || '');
        formData.append('image_data', message.image_data || '{}');
        formData.append('sender', message.sender || '');
        formData.append('receiver', message.receiver || receiver);
        formData.append('created_at', message.created_at || '');
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const query = await fetch(`${baseURL}/api/messages/send-message/${receiver}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData
        });
        if (!query) throw new Error("Failed to complete the query");
      } catch (error) {
        console.error("Failed to send message", error);
      }
    },
    
    // Add a new function to get messages
    getMessages: () => get().message,
    
    getSocket: () => get().socket,
  })
  )
);
