import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Message } from "../models/Messages";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

const getWebSocketURL = () => {
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

      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const trimmed = cookie.trim();
        const [cookieName, ...cookieValueParts] = trimmed.split("=");

        if (cookieName === name) {
          const cookieValue = cookieValueParts.join("=");
          return decodeURIComponent(cookieValue || "");
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing cookies:", error);
      return null;
    }
  };

  const getJWTToken = (): string | null => {
    if (!document.cookie) {
      console.log("No cookies found at all");
      return null;
    }

    // Try primary JWT cookie names
    const cookieNames = ["jwt", "token", "authToken", "access_token"];

    for (const name of cookieNames) {
      const token = getCookieValue(name);
      if (token && token.length > 10 && token.split(".").length === 3) {
        console.log(`Found JWT token with name: ${name}`);
        return token;
      }
    }

    console.log("No JWT token found");
    console.log("Available cookies:", document.cookie);
    return null;
  };

  const handleWebSocketMessage = useCallback(
    (data: WebSocketMessage) => {
      switch (data.type) {
        case "connection_established":
          console.log(
            "WebSocket connection established for user:",
            data.userId
          );
          break;

        case "new_message":
          if (onNewMessage && data.message) {
            onNewMessage(data.message);
          }

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "message_delivered",
                messageId: data.message?.messageId,
              })
            );
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
              return prev.includes(data.userId) ? prev : [...prev, data.userId];
            } else {
              return prev.filter((id: number) => id !== data.userId);
            }
          });
          break;

        case "online_users":
          if (data.users && Array.isArray(data.users)) {
            setOnlineUsers(
              data.users
                .map((u: any) => u.userId)
                .filter((id: any) => typeof id === "number")
            );
          }
          break;

        case "error":
          console.error("WebSocket error:", data.error);
          break;

        case "pong":
          // Handle pong response
          break;

        default:
          console.log("Unknown WebSocket message type:", data.type);
      }
    },
    [onNewMessage, onMessageSent, onMessageDelivered, onMessageRead]
  );

  const connect = useCallback(() => {
    if (!user?.id || !isLoggedIn) {
      console.log("Cannot connect WebSocket: user not authenticated", {
        userId: user?.id,
        isLoggedIn,
      });
      return;
    }

    if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket already connecting, skipping...");
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      console.log("Closing existing WebSocket connection");
      wsRef.current.close();
    }

    setConnectionStatus("connecting");

    const token = getJWTToken();
    if (!token) {
      console.error("No JWT token found for WebSocket connection");
      console.error("Available cookies:", document.cookie);
      setConnectionStatus("error");

      // Retry logic for token not found
      setTimeout(() => {
        if (reconnectAttempts.current < 3) {
          reconnectAttempts.current++;
          console.log("Retrying WebSocket connection after token not found...");
          connect();
        }
      }, 2000);
      return;
    }

    console.log("Attempting WebSocket connection with:");
    console.log("- WebSocket URL:", ws_baseURL);
    console.log("- Token preview:", token.substring(0, 20) + "...");
    console.log("- User ID:", user.id);

    const wsUrl = `${ws_baseURL}?token=${encodeURIComponent(token)}`;

    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        console.log("✅ WebSocket connected successfully");
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

        // Start heartbeat
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus("disconnected");

        if (heartbeatIntervalRef.current) {
          window.clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }

        // Reconnection logic for unexpected disconnections
        const shouldReconnect =
          event.code !== 1000 && // Normal close
          event.code !== 1001 && // Going away
          event.code !== 1005 && // No status code
          event.code !== 3000 && // Custom close codes
          reconnectAttempts.current < maxReconnectAttempts &&
          user?.id &&
          isLoggedIn;

        if (shouldReconnect) {
          console.log(
            `WebSocket closed unexpectedly (code: ${event.code}), attempting reconnection...`
          );
          attemptReconnect();
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          setConnectionStatus("error");
        } else {
          console.log("WebSocket closed normally, no reconnection needed");
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("❌ WebSocket connection error:", error);
        setConnectionStatus("error");
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("error");
    }
  }, [user?.id, isLoggedIn, handleWebSocketMessage]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      setConnectionStatus("error");
      return;
    }

    reconnectAttempts.current++;
    console.log(
      `🔄 Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`
    );

    reconnectTimeoutRef.current = window.setTimeout(() => {
      connect();
      reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, 10000);
    }, reconnectDelay.current);
  }, [connect]);

  const sendMessage = useCallback(
    (receiverId: number, content: string): string | undefined => {
      if (
        !isConnected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      ) {
        console.error("WebSocket not connected, cannot send message");
        return undefined;
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;

      try {
        wsRef.current.send(
          JSON.stringify({
            type: "send_message",
            receiverId,
            content,
            tempId,
          })
        );
        return tempId;
      } catch (error) {
        console.error("Failed to send message via WebSocket:", error);
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
      )
        return;

      wsRef.current.send(
        JSON.stringify({
          type: "typing_start",
          receiverId,
        })
      );
    },
    [isConnected]
  );

  const sendTypingStop = useCallback(
    (receiverId: number) => {
      if (
        !isConnected ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN
      )
        return;

      wsRef.current.send(
        JSON.stringify({
          type: "typing_stop",
          receiverId,
        })
      );
    },
    [isConnected]
  );

  // Connect when user is authenticated
  useEffect(() => {
    if (user?.id && isLoggedIn) {
      console.log("🔗 Initiating WebSocket connection for user:", user.id);

      // Longer delay to ensure cookies are properly set
      const timeoutId = setTimeout(() => {
        connect();
      }, 2000);

      return () => clearTimeout(timeoutId);
    } else {
      console.log("❌ Cannot connect WebSocket - user not authenticated");

      // Clean up existing connection if user logs out
      if (wsRef.current) {
        wsRef.current.close(1000, "User logged out");
        setIsConnected(false);
        setConnectionStatus("disconnected");
      }
    }
  }, [user?.id, isLoggedIn, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        window.clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
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
