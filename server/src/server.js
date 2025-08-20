import express from "express";
import authRoutes from "./routes/auth.route.js";
import dotenv from "dotenv";
import { app, server } from "./config/socket.config.js";
import cookieParser from "cookie-parser";
import { oauthEntry } from "./oauth/oauth-entry.js";
import { oauthCallback } from "./oauth/oauth-callback.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();

const PORT = process.env.PORT;
export const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const JWT_SECRET = process.env.JWT_SECRET;

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
// app.use("/api/comm", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/auth/google", oauthEntry);
app.get("/auth/google/callback", oauthCallback);

server.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});
