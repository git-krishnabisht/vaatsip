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
      clientTracking: true,
      verifyClient: (info) => {
        try {
          const origin = info.origin || info.req.headers.origin;

          const allowedOrigins =
            process.env.NODE_ENV === "production"
              ? [
                  "https://vaatsip-web.vercel.app",
                  "https://vaatsip-web-git-master-krishna-projects.vercel.app",
                  "https://vaatsip-web-krishna-projects.vercel.app",
                  ...(process.env.FRONTEND_URI
                    ? [process.env.FRONTEND_URI]
                    : []),
                ]
              : [
                  "https://localhost:5173",
                  "https://localhost:3000",
                  "https://localhost:4173",
                  "https://127.0.0.1:4173",
                  "https://127.0.0.1:5173",
                  ...(process.env.FRONTEND_URI
                    ? [process.env.FRONTEND_URI]
                    : []),
                ];

          console.log("allowed origin: ", allowedOrigins);

          let originAllowed = false;
          if (origin) {
            originAllowed =
              allowedOrigins.some((allowed) => allowed === origin) ||
              (origin.includes("vaatsip-web") &&
                origin.endsWith(".vercel.app")) ||
              (origin.includes("-git-") && origin.endsWith(".vercel.app"));

            if (!originAllowed) {
              console.log(`WebSocket blocked origin: ${origin}`);
              console.log(`Allowed origins:`, allowedOrigins);
              return false;
            }
          }

          // Extract token from query parameters or cookies
          const parsedUrl = url.parse(info.req.url, true);
          let token = parsedUrl.query.token;

          if (!token) {
            const cookies = this.parseCookies(info.req.headers.cookie);
            token =
              cookies.jwt ||
              cookies.token ||
              cookies.authToken ||
              cookies.access_token;

            if (!token) {
              console.log("WebSocket: No token provided in query or cookies");
              console.log("Query params:", parsedUrl.query);
              console.log("Available cookies:", Object.keys(cookies));
              console.log("Cookie header:", info.req.headers.cookie);
              return false;
            }
          }

          // Handle URL encoded tokens
          if (typeof token === "string" && token.includes("%")) {
            token = decodeURIComponent(token);
          }

          // Additional token format validation
          if (
            !token ||
            typeof token !== "string" ||
            token.split(".").length !== 3
          ) {
            console.log("WebSocket: Invalid JWT token format");
            console.log(
              "Token preview:",
              token ? token.substring(0, 20) + "..." : "null"
            );
            return false;
          }

          console.log(
            `WebSocket auth attempt for token: ${token.substring(0, 20)}...`
          );

          // Verify JWT token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);

          if (!decoded.id || !decoded.email) {
            console.log("WebSocket: Invalid token payload", decoded);
            return false;
          }

          info.req.user = decoded;

          console.log(
            `✅ WebSocket auth successful for user ${decoded.id} (${decoded.email})`
          );
          return true;
        } catch (error) {
          console.error("❌ WebSocket auth failed:", error.message);

          if (error.name === "TokenExpiredError") {
            console.error("Token has expired at:", error.expiredAt);
          } else if (error.name === "JsonWebTokenError") {
            console.error("Invalid token format or signature");
          } else if (error.name === "NotBeforeError") {
            console.error("Token not active yet");
          }

          return false;
        }
      },
    });

    this.wss.on("connection", (ws, req) => {
      const user = req.user;

      try {
        console.log(
          `🔗 New WebSocket connection attempt for user ${user.id} (${user.email})`
        );

        // Close any existing connection for this user to prevent duplicates
        if (this.connections.has(user.id)) {
          const existingWs = this.connections.get(user.id);
          if (existingWs.readyState === WebSocket.OPEN) {
            console.log(`Closing existing connection for user ${user.id}`);
            existingWs.close(1000, "New connection established");
          }
        }

        // Store new connection
        this.connections.set(user.id, ws);
        this.userStatus.set(user.id, {
          status: "online",
          lastSeen: new Date(),
          connectionTime: new Date(),
        });

        console.log(
          `✅ User ${user.id} (${user.email}) connected via WebSocket`
        );

        // Send connection confirmation
        this.sendToUser(user.id, {
          type: "connection_established",
          userId: user.id,
          timestamp: new Date().toISOString(),
        });

        // Broadcast user online status
        this.broadcastUserStatus(user.id, "online");

        ws.on("message", async (data) => {
          try {
            const message = JSON.parse(data.toString());

            // Validate message structure
            if (!message || typeof message !== "object" || !message.type) {
              throw new Error("Invalid message structure");
            }

            await this.handleMessage(user.id, message);
          } catch (error) {
            console.error(
              `Error handling WebSocket message from user ${user.id}:`,
              error
            );

            // Send specific error back to client
            this.sendToUser(user.id, {
              type: "error",
              error: error.message || "Invalid message format",
              timestamp: new Date().toISOString(),
            });
          }
        });

        // Enhanced close handling
        ws.on("close", (code, reason) => {
          console.log(
            `❌ User ${
              user.id
            } disconnected (code: ${code}, reason: ${reason?.toString()})`
          );

          this.connections.delete(user.id);
          this.userStatus.set(user.id, {
            status: "offline",
            lastSeen: new Date(),
          });

          this.broadcastUserStatus(user.id, "offline");
        });

        // Enhanced error handling
        ws.on("error", (error) => {
          console.error(`WebSocket error for user ${user.id}:`, error);

          // Attempt to send error notification if connection is still open
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(
                JSON.stringify({
                  type: "connection_error",
                  error: "Connection encountered an error",
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

          this.broadcastUserStatus(user.id, "offline");
        });

        // Enhanced heartbeat system
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.ping();

              // Update last seen time
              this.userStatus.set(user.id, {
                status: "online",
                lastSeen: new Date(),
              });
            } catch (error) {
              console.error(`Ping failed for user ${user.id}:`, error);
              clearInterval(heartbeat);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Handle pong responses
        ws.on("pong", () => {
          this.userStatus.set(user.id, {
            status: "online",
            lastSeen: new Date(),
          });
        });

        // Clean up heartbeat on close
        ws.on("close", () => {
          clearInterval(heartbeat);
        });

        // Set connection timeout for inactive connections
        const connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            console.log(`Closing inactive connection for user ${user.id}`);
            ws.close(1000, "Connection timeout");
          }
        }, 5 * 60 * 1000); // 5 minutes timeout

        // Clear timeout on any activity
        ws.on("message", () => {
          clearTimeout(connectionTimeout);
        });

        ws.on("close", () => {
          clearTimeout(connectionTimeout);
        });
      } catch (error) {
        console.error(
          `Error setting up WebSocket connection for user ${user.id}:`,
          error
        );
        ws.close(1011, "Server error during connection setup");
      }
    });

    // Handle server-level errors
    this.wss.on("error", (error) => {
      console.error("WebSocket Server Error:", error);
    });

    console.log("✅ WebSocket server initialized successfully");
  }

  // Enhanced cookie parsing
  parseCookies(cookieHeader) {
    const cookies = {};

    if (!cookieHeader) {
      return cookies;
    }

    try {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        const key = parts[0]?.trim();
        const value = parts.slice(1).join("=")?.trim();

        if (key && value) {
          try {
            cookies[key] = decodeURIComponent(value);
          } catch (e) {
            // If decoding fails, use raw value
            cookies[key] = value;
          }
        }
      });
    } catch (error) {
      console.error("Error parsing cookies:", error);
    }

    return cookies;
  }

  async handleMessage(senderId, message) {
    try {
      // Enhanced message validation
      if (!message || typeof message !== "object" || !message.type) {
        throw new Error("Invalid message format: missing type");
      }

      // Update user activity
      this.userStatus.set(senderId, {
        status: "online",
        lastSeen: new Date(),
      });

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
          this.sendToUser(senderId, {
            type: "pong",
            timestamp: new Date().toISOString(),
          });
          break;
        default:
          console.log(
            `Unknown message type from user ${senderId}:`,
            message.type
          );
          this.sendToUser(senderId, {
            type: "error",
            error: `Unknown message type: ${message.type}`,
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error(`Error in handleMessage for user ${senderId}:`, error);
      this.sendToUser(senderId, {
        type: "error",
        error: error.message || "Failed to process message",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async handleSendMessage(senderId, message) {
    try {
      const { receiverId, content, tempId } = message;

      // Enhanced validation
      if (!receiverId || typeof receiverId !== "number") {
        throw new Error("Invalid receiver ID");
      }

      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        throw new Error("Message content cannot be empty");
      }

      if (content.length > 5000) {
        throw new Error("Message too long");
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
          error: "Recipient not found",
        });
        return;
      }

      console.log(
        `💬 Message from ${senderId} to ${receiverId}: ${content.substring(
          0,
          50
        )}...`
      );

      // Save message to database with transaction
      const newMessage = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          message: content.trim(),
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
        } else {
          console.log(`❌ Failed to deliver message to user ${receiverId}`);
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
        error: error.message || "Failed to send message",
        timestamp: new Date().toISOString(),
      });
    }
  }

  async handleMessageDelivered(userId, message) {
    try {
      const { messageId } = message;

      if (!messageId || typeof messageId !== "number") {
        return;
      }

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

      if (!messageId || typeof messageId !== "number") {
        return;
      }

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

    if (!receiverId || typeof receiverId !== "number") {
      return;
    }

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

    if (!receiverId || typeof receiverId !== "number") {
      return;
    }

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
    try {
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
    } catch (error) {
      console.error("Error getting online users:", error);
    }
  }

  sendToUser(userId, obj) {
    const connection = this.connections.get(userId);

    if (!connection || connection.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.send(JSON.stringify(obj));
      return true;
    } catch (error) {
      console.error(`Failed to send message to user ${userId}:`, error);

      // Clean up broken connection
      this.connections.delete(userId);
      this.userStatus.set(userId, {
        status: "offline",
        lastSeen: new Date(),
      });

      return false;
    }
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

          // Clean up broken connection
          this.connections.delete(connUserId);
          this.userStatus.set(connUserId, {
            status: "offline",
            lastSeen: new Date(),
          });
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

  // Enhanced broadcast with error handling
  broadcast(message, excludeUserId = null) {
    const disconnectedUsers = [];

    this.connections.forEach((connection, userId) => {
      if (
        userId !== excludeUserId &&
        connection.readyState === WebSocket.OPEN
      ) {
        try {
          connection.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Failed to broadcast to user ${userId}:`, error);
          disconnectedUsers.push(userId);
        }
      } else if (connection.readyState !== WebSocket.OPEN) {
        disconnectedUsers.push(userId);
      }
    });

    // Clean up disconnected users
    disconnectedUsers.forEach((userId) => {
      this.connections.delete(userId);
      this.userStatus.set(userId, {
        status: "offline",
        lastSeen: new Date(),
      });
    });
  }

  // Utility method to get connection stats
  getConnectionStats() {
    const totalConnections = this.connections.size;
    const onlineUsers = Array.from(this.userStatus.values()).filter(
      (status) => status.status === "online"
    ).length;

    return {
      totalConnections,
      onlineUsers,
      connections: Array.from(this.connections.keys()),
    };
  }

  // Cleanup method for maintenance
  cleanupStaleConnections() {
    const staleConnections = [];

    this.connections.forEach((connection, userId) => {
      if (connection.readyState !== WebSocket.OPEN) {
        staleConnections.push(userId);
      }
    });

    staleConnections.forEach((userId) => {
      this.connections.delete(userId);
      this.userStatus.set(userId, {
        status: "offline",
        lastSeen: new Date(),
      });
    });

    if (staleConnections.length > 0) {
      console.log(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }
}

export const wsManager = new WebSocketManager();
export default wsManager;
