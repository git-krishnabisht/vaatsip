import { WebSocketServer, WebSocket } from "ws";
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
                  ...(process.env.FRONTEND_URI ? [process.env.FRONTEND_URI] : []),
                ]
              : [
                  "https://localhost:5173",
                  "https://localhost:3000",
                  "https://localhost:4173",
                  "https://127.0.0.1:4173",
                  "https://127.0.0.1:5173",
                  ...(process.env.FRONTEND_URI ? [process.env.FRONTEND_URI] : []),
                ];

          if (origin) {
            const isAllowed = allowedOrigins.some(
              (allowed) => allowed === origin
            );

            const isVercelApp =
              origin.includes("vaatsip-web") && origin.endsWith(".vercel.app");

            const isVercelPreview =
              origin.includes("-git-") && origin.endsWith(".vercel.app");

            if (!isAllowed && !isVercelApp && !isVercelPreview) {
              console.log(`WebSocket blocked origin: ${origin}`);
              return false;
            }
          }

          const parsedUrl = url.parse(info.req.url, true);
          let token = parsedUrl.query.token;

          if (!token) {
            const cookies = this.parseCookies(info.req.headers.cookie);
            token = cookies.jwt || cookies.token || cookies.authToken;

            if (!token) {
              console.log("WebSocket: No token provided in query or cookies");
              console.log("Available cookies:", Object.keys(cookies));
              return false;
            }
          }

          if (typeof token === "string" && token.includes("%")) {
            token = decodeURIComponent(token);
          }

          console.log(
            `WebSocket auth attempt for token: ${token.substring(0, 20)}...`
          );

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          info.req.user = decoded;

          console.log(
            `✅ WebSocket auth successful for user ${decoded.id} (${decoded.email})`
          );
          return true;
        } catch (error) {
          console.error("❌ WebSocket auth failed:", error.message);

          // Log more details for debugging
          if (error.name === "TokenExpiredError") {
            console.error("Token has expired");
          } else if (error.name === "JsonWebTokenError") {
            console.error("Invalid token format");
          }

          return false;
        }
      },
    });

    this.wss.on("connection", (ws, req) => {
      const user = req.user;

      // Close any existing connection for this user
      if (this.connections.has(user.id)) {
        const existingWs = this.connections.get(user.id);
        if (existingWs.readyState === WebSocket.OPEN) {
          existingWs.close(1000, "New connection established");
        }
      }

      this.connections.set(user.id, ws);
      this.userStatus.set(user.id, {
        status: "online",
        lastSeen: new Date(),
      });

      console.log(`✅ User ${user.id} (${user.email}) connected via WebSocket`);

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
          console.error(
            `Error handling WebSocket message from user ${user.id}:`,
            error
          );
          this.sendToUser(user.id, {
            type: "error",
            error: "Invalid message format",
          });
        }
      });

      ws.on("close", (code, reason) => {
        this.connections.delete(user.id);
        this.userStatus.set(user.id, {
          status: "offline",
          lastSeen: new Date(),
        });

        console.log(
          `❌ User ${user.id} disconnected (code: ${code}, reason: ${reason})`
        );
        this.broadcastUserStatus(user.id, "offline");
      });

      // Enhanced error handling
      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${user.id}:`, error);

        // Send error info to client before cleanup if possible
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(
              JSON.stringify({
                type: "connection_error",
                error: "Connection lost, please refresh",
                timestamp: new Date().toISOString(),
              })
            );
          } catch (e) {
            console.error("Failed to send error message:", e);
          }
        }

        // Clean up connection
        this.connections.delete(user.id);
        this.userStatus.set(user.id, {
          status: "offline",
          lastSeen: new Date(),
        });

        // Broadcast user offline status
        this.broadcastUserStatus(user.id, "offline");
      });

      // Enhanced heartbeat with better error handling
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.ping();
          } catch (error) {
            console.error(`Ping failed for user ${user.id}:`, error);
            clearInterval(heartbeat);
          }
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

      // Clean up on connection close
      ws.on("close", () => {
        clearInterval(heartbeat);
      });
    });

    console.log("✅ WebSocket server initialized");
  }

  // Helper method to parse cookies from header string
  parseCookies(cookieHeader) {
    const cookies = {};
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        const key = parts[0].trim();
        const value = parts.slice(1).join("=").trim();
        if (key && value) {
          cookies[key] = decodeURIComponent(value);
        }
      });
    }
    return cookies;
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
        case "ping":
          // Respond to ping with pong
          this.sendToUser(senderId, { type: "pong" });
          break;
        default:
          console.log(
            `Unknown message type from user ${senderId}:`,
            message.type
          );
          this.sendToUser(senderId, {
            type: "error",
            error: `Unknown message type: ${message.type}`,
          });
      }
    } catch (error) {
      console.error(`Error in handleMessage for user ${senderId}:`, error);
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

      // Validate receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
        select: { id: true, name: true, avatar: true },
      });

      if (!receiver) {
        this.sendToUser(senderId, {
          type: "message_error",
          tempId,
          error: "Receiver not found",
        });
        return;
      }

      console.log(
        `💬 Message from ${senderId} to ${receiverId}: ${content.substring(
          0,
          50
        )}...`
      );

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
        const sent = this.sendToUser(receiverId, {
          type: "new_message",
          message: newMessage,
          timestamp: new Date().toISOString(),
        });

        if (sent) {
          console.log(`✅ Message delivered to online user ${receiverId}`);
        }
      } else {
        console.log(
          `📱 User ${receiverId} is offline, message saved for later`
        );
      }
    } catch (error) {
      console.error(`Error sending message from ${senderId}:`, error);
      this.sendToUser(senderId, {
        type: "message_error",
        tempId: message.tempId || "unknown",
        error: "Failed to send message",
      });
    }
  }

  async handleMessageDelivered(userId, message) {
    try {
      const { messageId } = message;

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
    if (connection && connection.readyState === WebSocket.OPEN) {
      try {
        connection.send(JSON.stringify(obj));
        return true;
      } catch (error) {
        console.error(`Failed to send message to user ${userId}:`, error);
        return false;
      }
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
      if (connUserId !== userId && connection.readyState === WebSocket.OPEN) {
        try {
          connection.send(JSON.stringify(statusMessage));
        } catch (error) {
          console.error(
            `Failed to broadcast status to user ${connUserId}:`,
            error
          );
        }
      }
    });
  }

  isUserOnline(userId) {
    const connection = this.connections.get(userId);
    return connection && connection.readyState === WebSocket.OPEN;
  }

  getUserStatus(userId) {
    return this.userStatus.get(userId) || { status: "offline", lastSeen: null };
  }

  // Broadcast to all connections
  broadcast(message, excludeUserId = null) {
    this.connections.forEach((connection, userId) => {
      if (
        userId !== excludeUserId &&
        connection.readyState === WebSocket.OPEN
      ) {
        try {
          connection.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Failed to broadcast to user ${userId}:`, error);
        }
      }
    });
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
