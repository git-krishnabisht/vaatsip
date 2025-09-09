// server/src/server.js
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import commRoutes from "./routes/comm.route.js";
import { oauthEntry } from "./oauth/oauth-entry.js";
import { oauthCallback } from "./oauth/oauth-callback.js";
import wsManager from "./config/websocket.config.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 50136;
export const REDIRECT_URI = process.env.GOOGLE_AUTH_CALLBACK;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const JWT_SECRET = process.env.JWT_SECRET;

const corsOptions = {
  origin: "https://vaatsip-web.vercel.app",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

wsManager.initialize(server);

app.use("/api/comm", commRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/api/auth/google", oauthEntry);
app.get("/api/auth/google/callback", oauthCallback);

app.get("/api/health", (_, res) => {
  res.json({ 
    status: "ok", 
    websocket: wsManager.wss ? "running" : "not running",
    timestamp: new Date().toISOString() 
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`WebSocket server available at PORT: ${PORT}`);
});