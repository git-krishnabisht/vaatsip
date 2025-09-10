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

          console.log("WebSocket CORS check - Origin:", origin);
          console.log(
            "WebSocket CORS check - Allowed origins:",
            allowedOrigins
          );

          let originAllowed = false;
          if (origin) {
            originAllowed =
              allowedOrigins.some((allowed) => allowed === origin) ||
              (origin.includes("vaatsip-web") &&
                origin.endsWith(".vercel.app")) ||
              (origin.includes("-git-") && origin.endsWith(".vercel.app"));

            if (!originAllowed) {
              console.log(`❌ WebSocket blocked origin: ${origin}`);
              return false;
            }
          }

          const parsedUrl = url.parse(info.req.url, true);
          let token = parsedUrl.query.token;

          console.log(
            "WebSocket Auth - Query token:",
            token ? "Found" : "Not found"
          );
          console.log(
            "WebSocket Auth - Query params:",
            Object.keys(parsedUrl.query)
          );

          if (!token) {
            const cookies = this.parseWebSocketCookies(info.req.headers.cookie);
            console.log(
              "WebSocket Auth - Available cookies:",
              Object.keys(cookies)
            );

            const tokenPriority = ["jwt", "token", "access_token", "authToken"];

            for (const cookieName of tokenPriority) {
              if (cookies[cookieName]) {
                token = cookies[cookieName];
                console.log(
                  `✅ WebSocket token found in cookie: ${cookieName}`
                );
                break;
              }
            }

            if (!token) {
              console.log("❌ WebSocket: No token found in query or cookies");
              console.log("Cookie header:", info.req.headers.cookie);
              return false;
            }
          }

          token = this.validateAndCleanToken(token);

          if (!token) {
            console.log("❌ WebSocket: Token validation failed");
            return false;
          }

          console.log(
            `WebSocket auth attempt with token: ${token.substring(0, 20)}...`
          );

          let decoded;
          try {
            decoded = jwt.verify(token, process.env.JWT_SECRET, {
              algorithms: ["HS256"],
            });
          } catch (jwtError) {
            console.error(
              "❌ WebSocket JWT verification failed:",
              jwtError.message
            );

            if (jwtError.name === "TokenExpiredError") {
              console.error("Token expired at:", jwtError.expiredAt);
            } else if (jwtError.name === "JsonWebTokenError") {
              console.error("Invalid token signature or format");
            }

            return false;
          }

          if (!decoded || !decoded.id || !decoded.email) {
            console.log("❌ WebSocket: Invalid token payload", decoded);
            return false;
          }

          info.req.user = decoded;

          console.log(
            `✅ WebSocket auth successful for user ${decoded.id} (${decoded.email})`
          );
          return true;
        } catch (error) {
          console.error("❌ WebSocket auth error:", error);
          return false;
        }
      },
    });

    this.wss.on("connection", (ws, req) => {
      const user = req.user;

      try {
        console.log(
          `🔗 WebSocket connection established for user ${user.id} (${user.email})`
        );

        if (this.connections.has(user.id)) {
          const existingWs = this.connections.get(user.id);
          if (existingWs.readyState === WebSocket.OPEN) {
            console.log(`Closing existing connection for user ${user.id}`);
            existingWs.close(1000, "New connection established");
          }
        }

        this.connections.set(user.id, ws);
        this.userStatus.set(user.id, {
          status: "online",
          lastSeen: new Date(),
          connectionTime: new Date(),
        });

        console.log(
          `✅ User ${user.id} (${user.email}) connected via WebSocket`
        );

        this.sendToUser(user.id, {
          type: "connection_established",
          userId: user.id,
          timestamp: new Date().toISOString(),
        });

        this.broadcastUserStatus(user.id, "online");

        ws.on("message", async (data) => {
          try {
            const message = JSON.parse(data.toString());
            if (!message || typeof message !== "object" || !message.type) {
              throw new Error("Invalid message structure");
            }
            await this.handleMessage(user.id, message);
          } catch (error) {
            console.error(
              `Error handling WebSocket message from user ${user.id}:`,
              error
            );
            this.sendToUser(user.id, {
              type: "error",
              error: error.message || "Invalid message format",
              timestamp: new Date().toISOString(),
            });
          }
        });

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

        ws.on("error", (error) => {
          console.error(`WebSocket error for user ${user.id}:`, error);
          this.connections.delete(user.id);
          this.userStatus.set(user.id, {
            status: "offline",
            lastSeen: new Date(),
          });
          this.broadcastUserStatus(user.id, "offline");
        });

        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.ping();
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

        ws.on("pong", () => {
          this.userStatus.set(user.id, {
            status: "online",
            lastSeen: new Date(),
          });
        });

        ws.on("close", () => {
          clearInterval(heartbeat);
        });
      } catch (error) {
        console.error(
          `Error setting up WebSocket connection for user ${user.id}:`,
          error
        );
        ws.close(1011, "Server error during connection setup");
      }
    });

    this.wss.on("error", (error) => {
      console.error("WebSocket Server Error:", error);
    });

    console.log("✅ WebSocket server initialized successfully");
  }

  parseWebSocketCookies(cookieHeader) {
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
          } catch (decodeError) {
            cookies[key] = value;
          }
        }
      });
    } catch (error) {
      console.error("Error parsing WebSocket cookies:", error);
    }

    return cookies;
  }

  validateAndCleanToken(token) {
    if (!token || typeof token !== "string") {
      return null;
    }

    if (token.includes("%")) {
      try {
        token = decodeURIComponent(token);
      } catch (error) {
        console.error("Failed to decode token:", error);
        return null;
      }
    }

    if (token.split(".").length !== 3) {
      console.log(
        "Invalid JWT format - expected 3 parts, got:",
        token.split(".").length
      );
      return null;
    }

    if (token.length < 100) {
      console.log("Token too short, likely invalid");
      return null;
    }

    return token;
  }

  async handleMessage(senderId, message) {
    try {
      if (!message || typeof message !== "object" || !message.type) {
        throw new Error("Invalid message format: missing type");
      }

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

      this.sendToUser(senderId, {
        type: "message_sent",
        tempId,
        message: newMessage,
        timestamp: new Date().toISOString(),
      });

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

    disconnectedUsers.forEach((userId) => {
      this.connections.delete(userId);
      this.userStatus.set(userId, {
        status: "offline",
        lastSeen: new Date(),
      });
    });
  }

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
