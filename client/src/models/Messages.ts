export interface User {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Attachment {
  imageId: number;
  imageType: string;
  imageData?: Uint8Array;
}

export interface Message {
  messageId: number;
  senderId: number;
  receiverId: number;
  message: string;
  createdAt: string;
  sender: User;
  receiver: User;
  attachments: Attachment[];
}