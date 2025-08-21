import { io, getReceiverSocketId } from "../config/socket.config.js";

export function notifyUserMessage({
  sender,
  receiver,
  message,
  image,
  created_at,
}) {
  const socketId = getReceiverSocketId(receiver);
  if (socketId) {
    io.to(socketId).emit("newMessage", {
      msg: message,
      base64Image: image,
      sender,
      receiver,
      created_at,
    });
    console.log("Message sent via socket to:", receiver);
  }
}
