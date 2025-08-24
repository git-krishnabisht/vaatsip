import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Message } from "../models/Messages";

export function useMessages() {
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiver_id) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `http://localhost:50136/api/comm/get-messages/${receiver_id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          if (res.status === 404) {
            // No messages found is not an error, just empty state
            setMessages([]);
            return;
          }
          throw new Error(`Failed to fetch messages: ${res.status}`);
        }

        const data = (await res.json()) as Message[];
        setMessages(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Error fetching messages:", err);
        setError(err.message || "Something went wrong");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [receiver_id]);

  return { messages, loading, error };
}
