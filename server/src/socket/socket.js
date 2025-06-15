// question 1 - why do we need seperate cors configuration for express and socket.io

import http from "http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";

const app = express();

const corsOptions = {
  origin: "http://localhost:5000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "UPDATE", "OPTION"],
};

app.use(cors(corsOptions));

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});

const userSocketMap = {};

export function getReceiverSocketId(username) {
  return userSocketMap[username];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const username = socket.handshake.query.username;
  if (username) userSocketMap[username] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[username];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
