import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import dotenv from "dotenv";
import { app, server } from "./socket/socket.js";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users",  userRoutes);

app.use(express.static(path.join(__dirname, '../../client/public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/public/index.html'));
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});