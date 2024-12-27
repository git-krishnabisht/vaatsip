import {create} from "zustand";
// import { io } from "socket.io-client"
// import { useState } from "react";
const baseURL = "http://localhost:50136";

export const useStore = create((set) => ({
    isSignedIn: null,
    user: null,

    signin: async (credentials) => {
        set({ isSignedIn:true});
        try {
            const res = await fetch(`${baseURL}/sign-in`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(credentials)
            });

            if(res.ok) {
                const data = await res.json();
                if(!data.token) {
                    console.log("Token not found");
                    return;
                }
                localStorage.setItem("token", data.token);
                set({ isSignedIn: true });
                set({ user: data.username});
            } else {
                console.log("Failed to sign in ");
            }
        } catch(err) {
            console.error("Error : " , err.stack);
        }
    }
}));
