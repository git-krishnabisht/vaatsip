export interface User {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Message {
  messageId: number;
  message: string | null;
  createdAt: string;
  sender: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
  receiver: {
    id: number;
    name: string | null;
    avatar: string | null;
  };
}

export const getUsers = async (): Promise<User[]> => {
  const res = await fetch("http://localhost:50136/api/users/get-users", {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const data = await res.json();

  console.log("data: ", data.data)
  return data.data as User[];
};

export const getMessages = async (receiverId: number): Promise<Message[]> => {
  const res = await fetch(`http://localhost:50136/api/comm/get-messages/${receiverId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  const data = await res.json();
  return data.body as Message[];
};

export const sendMessage = async (receiverId: number, message: string): Promise<Message> => {
  const res = await fetch(`http://localhost:50136/api/comm/send-message/${receiverId}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("Failed to send message");
  }

  const data = await res.json();
  return data.body as Message;
};

