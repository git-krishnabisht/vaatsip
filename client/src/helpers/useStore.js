import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io } from "socket.io-client";
const baseURL = "http://localhost:50136";

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
          const res = await fetch(`${baseURL}/sign-in`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          if (!res.ok) {
            let data = await res.json();
            console.error(data.error);
            return;
          }
          const data = await res.json();
          localStorage.setItem("token", data.token);
          set({ isSignedIn: true, user: credentials.username });
          get().connectSocket();
        } catch (err) {
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
      },

      signup: async (credentials) => {
        try {
          const res = await fetch(`${baseURL}/sign-up`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });
          const data = await res.json();
          if (res.ok) {
            set({ isSignedUp: true });
            console.log(data.message);
          } else {
            console.log(data.error);
          }
        } catch (err) {
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
          const req = await fetch(`${baseURL}/get-user`, {
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

          const req = await fetch(`${baseURL}/upload-profile`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          const res = await req.json();

          if (req.ok) {
            console.log(res.message || "Image uploaded successfully.");
          } else {
            console.error(res.error || "Failed to upload image.");
          }
        } catch (err) {
          console.error(
            "Error:",
            err.message || err.stack || "Unexpected error."
          );
        }
      },

      getusers: async () => {
        try {
          const response = await fetch(`${baseURL}/get-users`);
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

      // All Real time chat helpers
      connectSocket: () => {
        const isSignedIn = get().isSignedIn;
        if (!isSignedIn || get().socket?.connected) return;

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

      listenToMessages: async () => {
        const receiver = get().receiver;
        if (!receiver) return;

        const socket = get().socket;
        socket.on("newMessage", (msg) => {
          set({ messages: [...get().messages, msg] });
        });
      },

      muteMessages: async() => {
        const socket = get().socket;
        socket.off("newMessage");
      },

      sendMessage: async (msg) => {
        const receiver = get().receiver;
        const messages = get().messages;
        try{
          const token = localStorage.getItem("token");
          if (!token) {
            console.error("No token found. Please sign in again.");
            return;
          }
          const response = await fetch(`${baseURL}/send-message/${receiver}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: msg }) // to-do
          });
          const data = await response.json();
          console.log(data);
          set({ messages: [...messages, msg] });
        } catch(err) {
          console.error("Error:", err || err.messgae || err.stack || "Unexpected error.");
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
          const response = await fetch(`${baseURL}/get-messages/${receiver}`, {
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