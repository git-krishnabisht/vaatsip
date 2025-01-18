import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import { app, server } from "./lib/socket.js";

dotenv.config();

app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});
