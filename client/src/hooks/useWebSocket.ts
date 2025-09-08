import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import type { Message } from "../models/Messages";

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

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
  const { user } = useAuth();
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
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
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
    if (!user?.id || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionStatus("connecting");

    const token = getCookieValue("jwt");
    if (!token) {
      console.error("No JWT token found for WebSocket connection");
      setConnectionStatus("error");
      return;
    }

    const wsUrl = `ws://localhost:50136/ws?token=${encodeURIComponent(token)}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("WebSocket connected");
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
  }, [user?.id, handleWebSocketMessage]);

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
    if (user?.id) {
      connect();
    }

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
  }, [user?.id, connect]);

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
