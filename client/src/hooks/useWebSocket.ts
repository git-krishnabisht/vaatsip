import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Message } from "../models/Messages";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

const ws_baseURL =
  import.meta.env.VITE_WS_API_BASE || "ws://localhost:50136/ws";

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
  const { user, isLoggedIn } = useAuth(); // Add isLoggedIn to ensure we're authenticated
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

  // Improved cookie parsing function
  const getCookieValue = (name: string): string | null => {
    try {
      const cookies = document.cookie.split(";");
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split("=");
        if (cookieName === name) {
          return decodeURIComponent(cookieValue || "");
        }
      }
      return null;
    } catch (error) {
      console.error("Error parsing cookies:", error);
      return null;
    }
  };

  // Alternative method to get JWT token - try multiple possible cookie names
  const getJWTToken = (): string | null => {
    console.log("=== JWT Token Debug ===");
    console.log("All cookies:", document.cookie);

    if (!document.cookie) {
      console.log("No cookies found at all");
      return null;
    }

    // Split cookies and log each one
    const cookies = document.cookie.split(";").map((c) => c.trim());
    console.log("Parsed cookies:", cookies);

    // Try different possible cookie names
    const possibleNames = ["jwt", "token", "authToken", "access_token"];

    for (const name of possibleNames) {
      const token = getCookieValue(name);
      if (token && token.length > 10) {
        console.log(`Found JWT token with name: ${name}`);
        console.log(`Token preview: ${token.substring(0, 20)}...`);
        return token;
      }
    }

    // Debug: Show all cookie names we found
    const foundNames = cookies.map((c) => c.split("=")[0]).filter((n) => n);
    console.log("Available cookie names:", foundNames);

    // Try to find any cookie that looks like a JWT (contains dots)
    for (const cookie of cookies) {
      const [name, value] = cookie.split("=");
      if (value && value.includes(".") && value.split(".").length === 3) {
        console.log(
          `Found JWT-like cookie: ${name} = ${value.substring(0, 20)}...`
        );
        return value;
      }
    }

    console.log("No JWT token found in any format");
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

        default:
          console.log("Unknown WebSocket message type:", data.type);
      }
    },
    [onNewMessage, onMessageSent, onMessageDelivered, onMessageRead]
  );

  const connect = useCallback(() => {
    // Enhanced connection checks
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

    setConnectionStatus("connecting");

    const token = getJWTToken();
    if (!token) {
      console.error("No JWT token found for WebSocket connection");
      console.error("Available cookies:", document.cookie);
      setConnectionStatus("error");
      return;
    }

    console.log(
      "Attempting WebSocket connection with token:",
      token.substring(0, 10) + "..."
    );

    const wsUrl = `${ws_baseURL}?token=${encodeURIComponent(token)}`;
    console.log("WebSocket URL:", wsUrl.replace(/token=[^&]*/, "token=***"));

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected successfully");
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

      if (
        event.code !== 1000 &&
        reconnectAttempts.current < maxReconnectAttempts
      ) {
        attemptReconnect();
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
        setConnectionStatus("error");
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
    };
  }, [user?.id, isLoggedIn, handleWebSocketMessage]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error("Max reconnection attempts reached");
      setConnectionStatus("error");
      return;
    }

    reconnectAttempts.current++;
    console.log(
      `Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`
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
        console.error("WebSocket not connected");
        return;
      }

      const tempId = `temp_${Date.now()}_${Math.random()}`;

      wsRef.current.send(
        JSON.stringify({
          type: "send_message",
          receiverId,
          content,
          tempId,
        })
      );

      return tempId;
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

  useEffect(() => {
    // Only connect if user is authenticated and we have the user data
    if (user?.id && isLoggedIn) {
      // Add a small delay to ensure cookies are properly set
      const timeoutId = setTimeout(() => {
        connect();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [user?.id, isLoggedIn, connect]);

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
