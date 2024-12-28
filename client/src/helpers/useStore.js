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
      userImage: null,
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
          console.log(data.message);
          get().connectSocket();
        } catch (err) {
          console.error("Error : ", err.stack || err.stack || "Unexpected error.");
        }
      },

      signout: () => {
        set({ isSignedIn: false, user: null });
        get().disconnectSocket();
        localStorage.clear();
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
          console.error("Error : ", err.error || err.stack || "Unexpected error.");
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
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          const res = await req.json();
          if (!req.ok) {
            console.error(res.error);
          } else {
            set({ user: res.username });
            console.log(res.message);
          }
        } catch (err) {
          console.error("Error : ", err.error || err.stack || "Unexpected error.");
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
          console.error("Error:", err.message || err.stack || "Unexpected error.");
        }
      },

      connectSocket:() => {
        const isSignedIn = get().isSignedIn;
        if(!isSignedIn || get().socket?.connected) return;

        const socket = io(baseURL)
        socket.connect();
        set({ socket: socket });
      },
      disconnectSocket: async () => {
        const socket = get().socket;
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      },
      getusers: async () => {},
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
