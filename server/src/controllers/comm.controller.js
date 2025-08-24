import prisma from "../utils/prisma.util.js";

export const get_messages = async (req, res) => {
  try {
    const user = req.user;
    if (!user || !user.id) {
      return res
        .status(400)
        .json({ success: false, error: "Sender not defined" });
    }

    const receiverId = parseInt(req.params.id, 10);
    if (isNaN(receiverId)) {
      return res
        .status(400)
        .json({ success: false, error: "Receiver ID must be a number" });
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

    if (!messages || messages.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "No messages found" });
    }

    return res.status(200).json(messages);
  } catch (err) {
    console.error("Error in get_messages:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Error fetching messages",
    });
  }
};

export const send_messages = async (req, res) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res
        .status(400)
        .json({ success: false, error: "Sender not defined" });
    }

    const receiverId = parseInt(req.params.receiver_id, 10);
    if (isNaN(receiverId)) {
      return res
        .status(400)
        .json({ success: false, error: "Receiver ID must be a number" });
    }

    const { message } = req.body;
    const files = req.files || [];

    if (!message && files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Message content or at least one attachment is required",
      });
    }

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
        attachments: { select: { imageId: true, imageType: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (err) {
    console.error("Error in send_messages:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Error sending message",
    });
  }
};
