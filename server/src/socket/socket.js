import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import cors from "cors";
import { URL } from "url";
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false
    : ["http://localhost:5000"],
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());

const wss = new WebSocketServer({ server });

const userSocketMap = new Map();

export function receiverSocket(username) {
  return userSocketMap.get(username);
}

wss.on("connection", (socket, request) => {
  console.log("New client connected");
  const query = new URL(request.url, 'http://localhost').searchParams;
  const username = query.get('username');

  if (!username) {
    console.log('No username provided, closing connection');
    socket.send(JSON.stringify({ type: 'error', text: 'Username is required' }));
    socket.close(1008, 'Username is required');
    return;
  }

  userSocketMap.set(username, socket);

  socket.send(JSON.stringify({ type: 'connection', text: 'Connected successfully' }));
  socket.send(JSON.stringify({ type: 'username', username }));

  broadcastUserList();

  // Handle messages from clients
  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
      
      if (message.type === 'message' && message.receiver) {
        const receiverWs = userSocketMap.get(message.receiver);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          console.log(`Sending message to ${message.receiver}`);
          receiverWs.send(JSON.stringify({
            type: 'message',
            sender: message.sender,
            receiver: message.receiver,
            message: message.message || '',
            created_at: message.created_at || new Date().toISOString()
          }));
        } else {
          console.log(`Receiver ${message.receiver} is not connected or socket not open`);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  socket.on('close', (code, reason) => {
    console.log(`User ${username} disconnected with code ${code} and reason ${reason}`);
    userSocketMap.delete(username);
    broadcastUserList();
  });

  socket.on('error', (error) => {
    console.error(`Error for user ${username}:`, error);
    userSocketMap.delete(username);
    broadcastUserList();
  });
});

function broadcastUserList() {
  const onlineUsers = Array.from(userSocketMap.keys());
  userSocketMap.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'userList',
        users: onlineUsers
      }));
    }
  });
}

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});

export { wss as io, app, server };