import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Message } from "../models/Messages";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

const getWebSocketURL = () => {
  // const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return "wss://localhost:50136/ws";
  }

  return "wss://vaatsip-web.onrender.com/ws";
};

const ws_baseURL = getWebSocketURL();

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (receiverId: number, content: string) => string | undefined;
  sendTypingStart: (receiverId: number) => void;
  sendTypingStop: (receiverId: number) => void;
  onlineUsers: number[];
  typingUsers: Map<number, boolean>;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

export function useWebSocket(
  onNewMessage?: (message: Message) => void,
  onMessageSent?: (tempId: string, message: Message) => void,
  onMessageDelivered?: (messageId: number) => void,
  onMessageRead?: (messageId: number) => void
): UseWebSocketReturn {
  const { user, isLoggedIn } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const heartbeatIntervalRef = useRef<number | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<number, boolean>>(
    new Map()
  );

  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  const getCookieValue = (name: string): string | null => {
    try {
      if (!document.cookie) {
        console.log("No cookies available in document");
        return null;
      }

      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);

      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(";").shift();
        if (cookieValue) {
          try {
            return decodeURIComponent(cookieValue);
          } catch (decodeError) {
            console.warn(`Failed to decode cookie ${name}, using raw value`);
            return cookieValue;
          }
        }
      }
      return null;
    } catch (error) {
      console.error(`Error parsing cookie ${name}:`, error);
      return null;
    }
  };

  const getJWTToken = (): string | null => {
    console.log("=== JWT Token Retrieval Debug ===");

    if (!document.cookie) {
      console.log("❌ No cookies found at all");
      return null;
    }

    console.log("Raw document.cookie:", document.cookie);

    const cookieNames = ["jwt", "token", "access_token", "authToken"];

    for (const name of cookieNames) {
      const token = getCookieValue(name);
      console.log(
        `Checking cookie '${name}':`,
        token ? `Found (${token.length} chars)` : "Not found"
      );

      if (token && token.length > 50) {
        const parts = token.split(".");
        if (parts.length === 3) {
          console.log(`✅ Valid JWT token found in cookie: ${name}`);
          console.log(`Token preview: ${token.substring(0, 30)}...`);
          return token;
        } else {
          console.warn(
            `Invalid JWT format in cookie ${name}: expected 3 parts, got ${parts.length}`
          );
        }
      }
    }

    console.log("❌ No valid JWT token found in any cookie");
    console.log(
      "Available cookies:",
      document.cookie.split(";").map((c) => c.trim().split("=")[0])
    );
    return null;
  };

  const handleWebSocketMessage = useCallback(
    (data: WebSocketMessage) => {
      console.log(`📨 WebSocket message received: ${data.type}`, data);

      try {
        switch (data.type) {
          case "connection_established":
            console.log(
              "✅ WebSocket connection established for user:",
              data.userId
            );
            setConnectionStatus("connected");
            break;

          case "new_message":
            if (onNewMessage && data.message) {
              onNewMessage(data.message);

              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "message_delivered",
                    messageId: data.message?.messageId,
                  })
                );
              }
            }
            break;

          case "message_sent":
            if (onMessageSent && data.tempId && data.message) {
              onMessageSent(data.tempId, data.message);
            }
            break;

          case "message_delivered":
            if (onMessageDelivered && data.messageId) {
              onMessageDelivered(data.messageId);
            }
            break;

          case "message_read":
            if (onMessageRead && data.messageId) {
              onMessageRead(data.messageId);
            }
            break;

          case "user_typing":
            setTypingUsers((prev) => {
              const newMap = new Map(prev);
              if (data.isTyping) {
                newMap.set(data.userId, true);

                setTimeout(() => {
                  setTypingUsers((current) => {
                    const updated = new Map(current);
                    updated.delete(data.userId);
                    return updated;
                  });
                }, 3000);
              } else {
                newMap.delete(data.userId);
              }
              return newMap;
            });
            break;

          case "user_status_changed":
            setOnlineUsers((prev) => {
              if (data.status === "online") {
                return prev.includes(data.userId)
                  ? prev
                  : [...prev, data.userId];
              } else {
                return prev.filter((id: number) => id !== data.userId);
              }
            });
            break;

          case "online_users":
            if (data.users && Array.isArray(data.users)) {
              const userIds = data.users
                .map((u: any) => u.userId)
                .filter((id: any) => typeof id === "number");
              console.log("📋 Online users received:", userIds);
              setOnlineUsers(userIds);
            }
            break;

          case "error":
            console.error("❌ WebSocket server error:", data.error);
            if (data.error?.includes("token") || data.error?.includes("auth")) {
              console.error(
                "🔑 Authentication error - may need to refresh token"
              );
              setConnectionStatus("error");

              setTimeout(() => {
                if (reconnectAttempts.current < 2) {
                  console.log("🔄 Retrying connection after auth error...");
                  connect();
                }
              }, 2000);
            }
            break;

          case "pong":
            console.log("💓 Heartbeat pong received");
            break;

          default:
            console.log("❓ Unknown WebSocket message type:", data.type, data);
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error, data);
      }
    },
    [onNewMessage, onMessageSent, onMessageDelivered, onMessageRead]
  );

  const connect = useCallback(() => {
    console.log("=== WebSocket Connection Attempt ===");

    if (!user?.id || !isLoggedIn) {
      console.log("❌ Cannot connect WebSocket: user not authenticated", {
        userId: user?.id,
        isLoggedIn,
      });
      setConnectionStatus("error");
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("⏳ WebSocket already connecting, skipping...");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("✅ WebSocket already connected");
      return;
    }

    if (wsRef.current) {
      console.log("🔄 Closing existing WebSocket connection");
      wsRef.current.close(1000, "Reconnecting");
    }

    setConnectionStatus("connecting");
    console.log("🔗 Setting connection status to 'connecting'");

    const token = getJWTToken();
    if (!token) {
      console.error("❌ No JWT token found for WebSocket connection");
      setConnectionStatus("error");

      if (reconnectAttempts.current < 3) {
        reconnectAttempts.current++;
        const delay = Math.min(
          1000 * Math.pow(2, reconnectAttempts.current),
          8000
        );
        console.log(
          `🔄 Retrying WebSocket connection in ${delay}ms (attempt ${reconnectAttempts.current}/3)`
        );

        setTimeout(() => {
          connect();
        }, delay);
      } else {
        console.error("❌ Max token retry attempts reached");
      }
      return;
    }

    console.log("🚀 Attempting WebSocket connection with:");
    console.log("  - WebSocket URL:", ws_baseURL);
    console.log("  - Token preview:", token.substring(0, 30) + "...");
    console.log("  - User ID:", user.id);

    const wsUrl = `${ws_baseURL}?token=${encodeURIComponent(token)}`;

    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        console.log("🎉 WebSocket connected successfully!");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "get_online_users",
            })
          );
        }

        heartbeatIntervalRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("💓 Sending heartbeat ping");
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("❌ Error parsing WebSocket message:", error);
          console.error("Raw message data:", event.data);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(
          `🔌 WebSocket disconnected - Code: ${event.code}, Reason: ${event.reason}`
        );
        setIsConnected(false);

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        const shouldReconnect =
          event.code !== 1000 &&
          event.code !== 1001 &&
          event.code !== 1005 &&
          event.code !== 3000 &&
          event.code !== 4000 &&
          reconnectAttempts.current < maxReconnectAttempts &&
          user?.id &&
          isLoggedIn;

        if (shouldReconnect) {
          console.log(
            `🔄 Unexpected disconnection (code: ${event.code}), attempting reconnection...`
          );
          setConnectionStatus("connecting");
          attemptReconnect();
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error("❌ Max reconnection attempts reached");
          setConnectionStatus("error");
        } else {
          console.log("✋ WebSocket closed normally, no reconnection needed");
          setConnectionStatus("disconnected");
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("❌ WebSocket connection error:", error);
        setConnectionStatus("error");

        console.error("WebSocket readyState:", wsRef.current?.readyState);
        console.error("WebSocket URL:", wsUrl);
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [user?.id, isLoggedIn, handleWebSocketMessage]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      setConnectionStatus("error");
      return;
    }

    reconnectAttempts.current++;
    const delay = Math.min(
      reconnectDelay.current * Math.pow(1.5, reconnectAttempts.current - 1),
      10000
    );

    console.log(
      `🔄 Scheduling reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms`
    );

    reconnectTimeoutRef.current = window.setTimeout(() => {
      console.log(
        `🔄 Executing reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`
      );
      connect();
    }, delay);
  }, [connect]);

  const sendMessage = useCallback(
    (receiverId: number, content: string): string | undefined => {
      if (
        !isConnected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        console.error("❌ WebSocket not connected, cannot send message");
        console.error("Connection state:", {
          isConnected,
          wsExists: !!wsRef.current,
          readyState: wsRef.current?.readyState,
        });
        return undefined;
      }

      if (!receiverId || typeof receiverId !== "number") {
        console.error("❌ Invalid receiverId:", receiverId);
        return undefined;
      }

      if (
        !content ||
        typeof content !== "string" ||
        content.trim().length === 0
      ) {
        console.error("❌ Invalid message content:", content);
        return undefined;
      }

      const tempId = `temp_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      try {
        const message = {
          type: "send_message",
          receiverId,
          content: content.trim(),
          tempId,
        };

        console.log("📤 Sending message:", message);
        wsRef.current.send(JSON.stringify(message));
        return tempId;
      } catch (error) {
        console.error("❌ Failed to send message via WebSocket:", error);
        return undefined;
      }
    },
    [isConnected]
  );

  const sendTypingStart = useCallback(
    (receiverId: number) => {
      if (
        !isConnected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      try {
        wsRef.current.send(
          JSON.stringify({
            type: "typing_start",
            receiverId,
          })
        );
      } catch (error) {
        console.error("❌ Failed to send typing start:", error);
      }
    },
    [isConnected]
  );

  const sendTypingStop = useCallback(
    (receiverId: number) => {
      if (
        !isConnected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        return;
      }

      try {
        wsRef.current.send(
          JSON.stringify({
            type: "typing_stop",
            receiverId,
          })
        );
      } catch (error) {
        console.error("❌ Failed to send typing stop:", error);
      }
    },
    [isConnected]
  );

  useEffect(() => {
    if (user?.id && isLoggedIn) {
      console.log(
        "👤 User authenticated, scheduling WebSocket connection for user:",
        user.id
      );

      const timeoutId = setTimeout(() => {
        console.log("⏰ Timeout elapsed, attempting WebSocket connection");
        connect();
      }, 3000);

      return () => {
        console.log("🧹 Clearing connection timeout");
        clearTimeout(timeoutId);
      };
    } else {
      console.log(
        "❌ User not authenticated, cleaning up WebSocket connection"
      );

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, "User logged out");
      }

      setIsConnected(false);
      setConnectionStatus("disconnected");
      setOnlineUsers([]);
      setTypingUsers(new Map());
    }
  }, [user?.id, isLoggedIn, connect]);

  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up WebSocket hook");

      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, "Component unmounting");
      }
    };
  }, []);

  return {
    isConnected,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    onlineUsers,
    typingUsers,
    connectionStatus,
  };
}
