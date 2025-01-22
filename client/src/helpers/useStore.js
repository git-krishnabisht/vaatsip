import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : ""; 

export const useStore = create(
  persist(
    (set, get) => ({
      isSignedIn: null,
      isSignedUp: null,
      user: null,
      users: {},
      receiver: null,
      userImage: null,
      onlineUsers: [],
      messages: [],
      socket: null,
      
      signin: async (credentials) => {
        try {
          const res = await fetch(`${baseURL}/api/auth/sign-in`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (!res.ok) {
            let data = await res.json();
            console.error(data.message);
            return;
          }
          const data = await res.json();
          localStorage.setItem("token", data.token);
          set({ isSignedIn: true, user: credentials.username });
          get().connectSocket();
          toast.success("Signed in successfully");
        } catch (err) {
          toast.error("Something is wrong");
          console.error(
            "Error : ",
            err.stack || err.stack || "Unexpected error."
          );
        }
      },

      signout: () => {
        set({ isSignedIn: false, user: null });
        get().disconnectSocket();
        ["states", "token"].forEach((key) => localStorage.removeItem(key));
        toast.success("Signed out successfully");
      },

      signup: async (credentials) => {
        try {
          const res = await fetch(`${baseURL}/api/auth/sign-up`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });
          const data = await res.json();
          if (res.ok) {
            set({ isSignedUp: true });
            toast.success("Account created successfully");
            console.log(data.message);
          } else {
            toast.error("Failed");
            console.log(data.error);
          }
        } catch (err) {
          toast.error("Something is wrong");
          console.error(
            "Error : ",
            err.error || err.stack || "Unexpected error."
          );
        }
      },

      getuser: async () => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No token found. Please sign in again.");
            return;
          }
          const req = await fetch(`${baseURL}/api/auth/get-user`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const res = await req.json();
          if (!req.ok) {
            console.error(res.error);
          } else {
          toast.success("Signed in successfully");
            set({ user: res });
          }
        } catch (err) {
          console.error(
            "Error : ",
            err.error || err.stack || "Unexpected error."
          );
        }
      },

      uploadprofile: async (img) => {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No token found. Please sign in again.");
            return;
          }

          if (!img) {
            console.error("No image file provided.");
            return;
          }

          const formData = new FormData();
          formData.append("image", img);

          const req = await fetch(`${baseURL}/api/auth/upload-profile`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const res = await req.json();
          if (req.ok) {
            console.log(res.message || "Image uploaded successfully.");
            toast.success("Profile uploaded successfully");
            return res.image;
          } else {
            toast.error("Failed");
            console.error(res.error || "Failed to upload image.");
          }
        } catch (err) {
          toast.error("Something is wrong");
          console.error(
            "Error:",
            err.message || err.stack || "Unexpected error."
          );
        }
      },

      getusers: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${baseURL}/api/auth/get-users`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });
          const data = await response.json();
          const users = data.map((user) => ({
            username: user.username,
            image: user.image
          }));
          set({ users });
        } catch (err) {
          console.error("Error:", err || err.messgae || err.stack || "Unexpected error.");
        }
      },

      connectSocket: () => {
        const isSignedIn = get().isSignedIn;
        if (!isSignedIn || get().socket?.connected) {
          console.log("Socket is already connected or user is not signed in.");
          return;
        }

        const socket = io(baseURL, {
          query: {
            username: get().user
          },
        });

        socket.connect();
        set({ socket: socket });

        socket.on("getOnlineUsers", (user) => {
          set({ onlineUsers: user });
        });
      },

      disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
      },

      subscribeToMessages: async (rece) => {
        if (!rece) return;

        const socket = get().socket;

        socket.on("newMessage", (msg) => {
          get().getMessages(rece);
          set((state) => ({ messages: [...state.messages, msg] }));
        });
      },

      unsubscribeFromMessages: async() => {
        const socket = get().socket;
        socket.off("newMessage");
      },

      convertFileToBinary: async (file) => {
        let aBuffer;
        if(file.arrayBuffer) {
          aBuffer = await file.arrayBuffer();
        } else if(!file.arrayBuffer) {
          return { data: null, type: null };
        }
        const data = new Uint8Array(aBuffer);
        return { data, type: file.type };
      },

      sendMessage: async (msg) => {
        const formData = new FormData();
        if (msg.message) formData.append("message", msg.message);
        if (msg.image_data) {
          formData.append("image_data", msg.image_data);
        }
        const receiver = get().receiver;
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please sign in again.");
          return;
        }
        try {
          const response = await fetch(`${baseURL}/api/messages/send-message/${receiver}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });
          const data = await response.json();

          if (!response.ok) throw new Error(data.error || 'Failed to send message');
          let temp = await get().convertFileToBinary(msg.image_data);
          const newMessage = {
            message: msg.message,
            image_data: temp,
            sender: msg.sender,
            receiver: msg.receiver,
            created_at: new Date().toISOString(), 
          };
          set((state) => ({ 
            messages: [...state.messages, newMessage]
          }));
          toast.success("Message sent successfully");
        } catch(err) {
          console.error("Error:", err?.message || "Failed to send message");
          toast.error("Something is wrong");
          throw err;
        }
      },
      
      getMessages: async (receiver) => {
        try {
          if (!receiver) {
            console.error("Receiver is not provided.");
            return;
          }
          set({ receiver: receiver });
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No token found. Please sign in again.");
            return;
          }
          const response = await fetch(`${baseURL}/api/messages/get-messages/${receiver}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (!response.ok) {
            console.log("Failed to fetch the messages");
            return;
          }
          const data = await response.json();
          set({ messages: data[0] });
        } catch (err) {
          console.error(
            "Error:",
            err.error || err.message || err.stack || "Unexpected error."
          );
        }
      },
    }),
    {
      name: "states",
      partialize: (states) => ({
        isSignedIn: states.isSignedIn,
        isSignedUp: states.isSignedUp,
        user: states.user,
      }),
    }
  )
);

export const connectSocket = () => {
  const { connectSocket } = useStore.getState();
  connectSocket();
};

export const disconnectSocket = () => {
  const { disconnectSocket } = useStore.getState();
  disconnectSocket();
}