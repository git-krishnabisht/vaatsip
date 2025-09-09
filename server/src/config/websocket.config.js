import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import url from "url";
import prisma from "../utils/prisma.util.js";

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.connections = new Map();
    this.userStatus = new Map();
  }

  initialize(server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      perMessageDeflate: false,
      maxPayload: 16 * 1024 * 1024,
      verifyClient: (info) => {
        try {
          const origin = info.origin || info.req.headers.origin;
          const allowedOrigins =
            process.env.NODE_ENV === "production"
              ? [
                  "https://vaatsip-web.vercel.app",
                  "https://vaatsip-web-git-master-krishna-projects.vercel.app",
                  "https://vaatsip-web-krishna-projects.vercel.app",
                ]
              : [
                  "http://localhost:5173",
                  "http://localhost:3000",
                  "http://localhost:4173",
                ];

          if (origin) {
            const isAllowed = allowedOrigins.some(
              (allowed) => allowed === origin
            );

            const isVercelApp =
              origin.includes("vaatsip-web") && origin.endsWith(".vercel.app");

            if (!isAllowed && !isVercelApp) {
              console.log(`WebSocket blocked origin: ${origin}`);
              return false;
            }
          }

          const parsedUrl = url.parse(info.req.url, true);
          const token = parsedUrl.query.token;

          if (!token) {
            console.log("WebSocket: No token provided");
            return false;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          info.req.user = decoded;

          console.log(`WebSocket auth successful for user ${decoded.id}`);
          return true;
        } catch (error) {
          console.error("WebSocket auth failed:", error.message);
          return false;
        }
      },
    });

    this.wss.on("connection", (ws, req) => {
      const user = req.user;

      this.connections.set(user.id, ws);
      this.userStatus.set(user.id, {
        status: "online",
        lastSeen: new Date(),
      });

      console.log(`User ${user.id} connected via WebSocket`);

      this.sendToUser(user.id, {
        type: "connection_established",
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      this.broadcastUserStatus(user.id, "online");

      ws.on("message", async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(user.id, message);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          this.sendToUser(user.id, {
            type: "error",
            error: "Invalid message format",
          });
        }
      });

      ws.on("close", () => {
        this.connections.delete(user.id);
        this.userStatus.set(user.id, {
          status: "offline",
          lastSeen: new Date(),
        });

        console.log(`User ${user.id} disconnected`);
        this.broadcastUserStatus(user.id, "offline");
      });

      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);
        this.connections.delete(user.id);
        this.userStatus.set(user.id, {
          status: "offline",
          lastSeen: new Date(),
        });
      });

      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        } else {
          clearInterval(heartbeat);
        }
      }, 30000);

      ws.on("pong", () => {
        this.userStatus.set(user.id, {
          status: "online",
          lastSeen: new Date(),
        });
      });
    });

    console.log("WebSocket server initialized");
  }

  async handleMessage(senderId, message) {
    try {
      // Validate message structure
      if (!message || typeof message !== "object" || !message.type) {
        this.sendToUser(senderId, {
          type: "error",
          error: "Invalid message format: missing type",
        });
        return;
      }

      switch (message.type) {
        case "send_message":
          await this.handleSendMessage(senderId, message);
          break;
        case "message_delivered":
          await this.handleMessageDelivered(senderId, message);
          break;
        case "message_read":
          await this.handleMessageRead(senderId, message);
          break;
        case "typing_start":
          this.handleTypingStart(senderId, message);
          break;
        case "typing_stop":
          this.handleTypingStop(senderId, message);
          break;
        case "get_online_users":
          this.handleGetOnlineUsers(senderId);
          break;
        default:
          console.log("Unknown message type:", message.type);
          this.sendToUser(senderId, {
            type: "error",
            error: `Unknown message type: ${message.type}`,
          });
      }
    } catch (error) {
      console.error("Error in handleMessage:", error);
      this.sendToUser(senderId, {
        type: "error",
        error: "Failed to process message",
      });
    }
  }

  async handleSendMessage(senderId, message) {
    try {
      const { receiverId, content, tempId } = message;

      if (!receiverId || !content) {
        this.sendToUser(senderId, {
          type: "message_error",
          tempId,
          error: "Missing required fields",
        });
        return;
      }

      // Save message to database
      const newMessage = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          message: content,
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          receiver: { select: { id: true, name: true, avatar: true } },
          attachments: {
            select: {
              imageId: true,
              imageType: true,
              imageData: true,
            },
          },
        },
      });

      // Send confirmation to sender
      this.sendToUser(senderId, {
        type: "message_sent",
        tempId,
        message: newMessage,
        timestamp: new Date().toISOString(),
      });

      // Send message to receiver if online
      if (this.isUserOnline(receiverId)) {
        this.sendToUser(receiverId, {
          type: "new_message",
          message: newMessage,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      this.sendToUser(senderId, {
        type: "message_error",
        tempId: message.tempId,
        error: "Failed to send message",
      });
    }
  }

  async handleMessageDelivered(userId, message) {
    try {
      const { messageId } = message;

      // Update delivery status in database (you may want to add a delivery status field)
      // For now, just relay to sender
      const msg = await prisma.message.findUnique({
        where: { messageId },
      });

      if (msg && this.isUserOnline(msg.senderId)) {
        this.sendToUser(msg.senderId, {
          type: "message_delivered",
          messageId,
          deliveredBy: userId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error handling message delivered:", error);
    }
  }

  async handleMessageRead(userId, message) {
    try {
      const { messageId } = message;

      // Update read status in database (you may want to add a read status field)
      const msg = await prisma.message.findUnique({
        where: { messageId },
      });

      if (msg && this.isUserOnline(msg.senderId)) {
        this.sendToUser(msg.senderId, {
          type: "message_read",
          messageId,
          readBy: userId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error handling message read:", error);
    }
  }

  handleTypingStart(senderId, message) {
    const { receiverId } = message;
    if (this.isUserOnline(receiverId)) {
      this.sendToUser(receiverId, {
        type: "user_typing",
        userId: senderId,
        isTyping: true,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleTypingStop(senderId, message) {
    const { receiverId } = message;
    if (this.isUserOnline(receiverId)) {
      this.sendToUser(receiverId, {
        type: "user_typing",
        userId: senderId,
        isTyping: false,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleGetOnlineUsers(userId) {
    const onlineUsers = Array.from(this.userStatus.entries())
      .filter(([_, status]) => status.status === "online")
      .map(([userId, status]) => ({
        userId,
        status: status.status,
        lastSeen: status.lastSeen,
      }));

    this.sendToUser(userId, {
      type: "online_users",
      users: onlineUsers,
      timestamp: new Date().toISOString(),
    });
  }

  sendToUser(userId, obj) {
    const connection = this.connections.get(userId);
    if (connection && connection.readyState === 1) {
      // WebSocket.OPEN = 1
      connection.send(JSON.stringify(obj));
      return true;
    }
    return false;
  }

  broadcastUserStatus(userId, status) {
    const statusMessage = {
      type: "user_status_changed",
      userId,
      status,
      lastSeen: new Date().toISOString(),
    };

    this.connections.forEach((connection, connUserId) => {
      if (connUserId !== userId && connection.readyState === 1) {
        // WebSocket.OPEN = 1
        connection.send(JSON.stringify(statusMessage));
      }
    });
  }

  isUserOnline(userId) {
    const connection = this.connections.get(userId);
    return connection && connection.readyState === 1; // WebSocket.OPEN = 1
  }

  getUserStatus(userId) {
    return this.userStatus.get(userId) || { status: "offline", lastSeen: null };
  }

  // Broadcast to all connections
  broadcast(message, excludeUserId = null) {
    this.connections.forEach((connection, userId) => {
      if (userId !== excludeUserId && connection.readyState === 1) {
        // WebSocket.OPEN = 1
        connection.send(JSON.stringify(message));
      }
    });
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
