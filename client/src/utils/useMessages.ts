import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface User {
  id: number;
  name: string;
  avatar: string | null;
}

interface Attachment {
  image_id: number;
  message_id: number;
  image_data: Uint8Array;
  image_type: string;
}

interface Message {
  messageId: number;
  senderId: number;
  receiverId: number;
  message: string;
  createdAt: string;
  sender: User;
  receiver: User;
  attachments: Attachment[];
}

export const useMessages = async () => {
  const { receiver_id } = useParams<{ receiver_id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!receiver_id) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `http://localhost:50136/api/comm/get-messages/${receiver_id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch messages");
        }

        const data = (await res.json()) as Message[];
        setMessages(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [receiver_id]);

  return { messages, loading, error };
};
