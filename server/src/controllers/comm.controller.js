import prisma from "../utils/prisma.util.js";
import { ServiceResponse } from "../utils/service-response.util.js";

export const get_messages = async (req, res) => {
  try {
    const user = req.user;
    console.log('get_messages called with user:', user);
    
    if (!user || !user.id) {
      console.log('User not authenticated in get_messages');
      return res
        .status(401)
        .json(ServiceResponse.unauthorized("User not authenticated"));
    }

    const receiverId = req.validatedUserId;
    console.log('Fetching messages between user', user.id, 'and receiver', receiverId);

    // Prevent users from accessing their own messages as if they were another user
    if (receiverId === user.id) {
      console.log('User trying to fetch messages with themselves');
      return res
        .status(400)
        .json(ServiceResponse.forbidden("Cannot fetch messages with yourself"));
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId },
          { senderId: receiverId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
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

    console.log(`Found ${messages.length} messages between users`);

    // Return messages in the format expected by the frontend
    return res.status(200).json({
      success: true,
      messages: messages || [], // Frontend expects 'messages' field
      message: "Messages retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in get_messages:", err);
    return res.status(500).json(
      ServiceResponse.error("Error fetching messages", err)
    );
  }
};

export const send_messages = async (req, res) => {
  try {
    const senderId = req.user?.id;
    console.log('send_messages called with sender:', senderId);
    
    if (!senderId) {
      console.log('Sender not authenticated in send_messages');
      return res
        .status(401)
        .json(ServiceResponse.unauthorized("User not authenticated"));
    }

    const receiverId = req.validatedUserId;
    console.log('Sending message from', senderId, 'to', receiverId);

    // Prevent users from sending messages to themselves
    if (receiverId === senderId) {
      console.log('User trying to send message to themselves');
      return res
        .status(400)
        .json(ServiceResponse.forbidden("Cannot send message to yourself"));
    }

    const { message } = req.body;
    const files = req.files || [];

    console.log('Message content:', message, 'Files count:', files.length);

    // Validate that we have either a message or files
    if (!message && files.length === 0) {
      console.log('No content provided for message');
      return res.status(400).json(
        ServiceResponse.validationError(
          { content: "Message content or at least one attachment is required" },
          "No content provided"
        )
      );
    }

    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        message: message || null,
        attachments:
          files.length > 0
            ? {
                create: files.map((file) => ({
                  imageData: file.buffer,
                  imageType: file.mimetype,
                })),
              }
            : undefined,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
        attachments: { select: { imageId: true, imageType: true } },
      },
    });

    console.log('Message created successfully:', newMessage.messageId);

    return res.status(201).json(
      ServiceResponse.success(newMessage, "Message sent successfully")
    );
  } catch (err) {
    console.error("Error in send_messages:", err);
    return res.status(500).json(
      ServiceResponse.error("Error sending message", err)
    );
  }
};
