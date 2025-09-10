import express from "express";
import fs from "fs";
import https from "https";
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

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const requiredEnvVars = [
  "JWT_SECRET",
  "CLOUD_DB_URI",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_AUTH_CALLBACK",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();

let server;

if (process.env.NODE_ENV === "development") {
  const key = fs.readFileSync("./certs/localhost-key.pem");
  const cert = fs.readFileSync("./certs/localhost.pem");
  server = https.createServer({ key, cert }, app);
  console.log("Running in DEV mode with HTTPS + local certs");
} else {
  server = http.createServer(app);
  console.log("Running in PROD mode with plain HTTP (SSL handled by platform)");
}

const PORT = process.env.PORT || 50136;
export const REDIRECT_URI = process.env.GOOGLE_AUTH_CALLBACK;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const JWT_SECRET = process.env.JWT_SECRET;

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        "https://vaatsip-web.vercel.app",
        "https://vaatsip-web-git-master-krishna-projects.vercel.app",
        "https://vaatsip-web-krishna-projects.vercel.app",
        ...(process.env.FRONTEND_URI ? [process.env.FRONTEND_URI] : []),
      ]
    : [
        "https://localhost:5173",
        "https://localhost:3000",
        "https://localhost:4173",
      ];

const corsOptions = {
  origin: (origin, callback) => {
    console.log(`CORS check for origin: ${origin}`);

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === "string") {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    const isVercelApp =
      origin.includes("vaatsip-web") && origin.endsWith(".vercel.app");

    const isVercelPreview =
      origin.includes("-git-") && origin.endsWith(".vercel.app");

    // Support for Vercel branch deployments
    const isVercelBranch =
      /https:\/\/vaatsip-web-.*-krishna-projects\.vercel\.app/.test(origin);

    if (isAllowed || isVercelApp || isVercelPreview || isVercelBranch) {
      console.log(`CORS allowed for origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

app.use((err, req, res, next) => {
  if (err.message === "Not allowed by CORS") {
    console.error(`CORS blocked request from origin: ${req.get("Origin")}`);
    return res.status(403).json({
      error: "CORS policy violation",
      origin: req.get("Origin"),
      allowedOrigins:
        process.env.NODE_ENV === "production"
          ? "Vercel deployments"
          : "localhost",
    });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Initialize WebSocket server
wsManager.initialize(server);

// Routes
app.use("/api/comm", commRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// OAuth routes
app.get("/api/auth/google", oauthEntry);
app.get("/api/auth/google/callback", oauthCallback);

// Fixed: Enhanced health check
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    websocket: wsManager.wss ? "running" : "not running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    server: "Vaatsip Chat API",
    version: "1.0.0",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Allowed origins:`, allowedOrigins);
  console.log(`WebSocket server available at PORT: ${PORT}`);
});
