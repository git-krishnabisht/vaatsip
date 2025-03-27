import { create } from "zustand";
import { persist } from "zustand/middleware";
import toast from "react-hot-toast";
const baseURL = import.meta.env.MODE === "development" ? "http://localhost:50136" : "";

export const userService = create(
  persist((set, get) => ({
    user: null,
    users: [],
    userImage: null,
    userDetails: null,

    getuser: async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please sign in again.");
          return;
        }
        const req = await fetch(`${baseURL}/api/users/get-user`, {
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

        const req = await fetch(`${baseURL}/api/users/upload-profile`, {
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
        const response = await fetch(`${baseURL}/api/users/get-users`, {
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

    getuserdetails: async (user) => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in the localstorage");
        }

        const response = await fetch(`${baseURL}/api/users/user-details/${user}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          console.error("Something is wrong with the response");
        }
        const details = await response.json();
        set({ userDetails: details.details });
      } catch (err) {
        console.error(err);
      }
    },
  }),
    {
      name: "user_states",
      partialize: (states) => ({
        user: states.user,
        onlineUsers: states.onlineUsers
      })
    })
);