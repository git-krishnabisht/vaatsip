import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/comm.route.js";
import userRoutes from "./routes/user.route.js";
import dotenv from "dotenv";
import { app, server } from "./config/socket.config.js";
import cookieParser from "cookie-parser";
import { protectedRoute } from "./middlewares/auth.middleware.js";
import { oauthEntry } from "./oauth/oauth-entry.js";
import { oauthCallback } from "./oauth/oauth-callback.js";
import { testProfile } from "./test/oauth.test-profile.js";
import { testLogout } from "./test/oauth.test-logout.js";

// import path from "path";
// import { fileURLToPath } from "url";

dotenv.config();

const PORT = process.env.PORT;
export const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
export const JWT_SECRET = process.env.JWT_SECRET;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/auth/google", oauthEntry);
app.get("/auth/google/callback", oauthCallback);
app.get("/profile", protectedRoute, testProfile);
app.post("/logout", testLogout);

app.get("/", (_, res) => {
  res.send(
    `<form action="/api/auth/sign-in">
      <button>sign-in</button>
    </form>`
  );
});

// app.use(express.static(path.join(__dirname, "../../client/public")));

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "../../client/public/index.html"));
// });

server.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});
