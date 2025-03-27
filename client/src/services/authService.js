import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
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
            toast.success("Signed in successfully");
          } else {
            console.error("No token received from server");
            toast.error("Authentication failed");
          }
        } catch (err) {
          toast.error("Something is wrong");
          console.error("Error:", err.message || err.stack || "Unexpected error.");
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
    }),
    {
      name: "auth_states",
      partialize: (states) => ({
        isSignedIn: states.isSignedIn,
      })
    }
  )
);
