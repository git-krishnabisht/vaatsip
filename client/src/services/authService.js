import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : "";

export const authService = create(
  persist(
    (set, get) => ({
      isSignedIn: null,
      isSignedUp: null,
      user: null,
      users: [],
      userImage: null,
      userDetails: null,
      onlineUsers: null,
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
            console.error(data.message || "Sign-in failed");
            toast.error(data.message || "Sign-in failed");
            return;
          }

          const data = await res.json();
          if (data.token) {
            localStorage.setItem("token", data.token);
            set({ isSignedIn: true, user: credentials.username });
            get().connectSocket();
            toast.success("Signed in successfully");
          } else {
            console.error("No token received from server");
            toast.error("Authentication failed");
          }
        } catch (err) {
          toast.error("Something is wrong");
          console.error("Error", err);
        }
      },

      signout: () => {
        set({ isSignedIn: false, user: null });
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

      connectSocket: () => {
        const { user } = get();
        console.log(user);
        if (!user || get().socket?.connected) return;
    
        const socket = io(baseURL, {
          query: {
            userId: user,
          },
        });

        socket.connect();
        set({ socket: socket });
        socket.on("getOnlineUsers", (users) => {
          set({ onlineUsers: users });
        });
      },

      disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
      },
    }),
    {
      name: "auth_states",
      partialize: (states) => ({
        isSignedIn: states.isSignedIn,
      })
    }
  )
);
