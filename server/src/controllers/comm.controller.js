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

    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });

    if (!receiverExists) {
      return res.status(404).json({ success: false, error: "User not found" });
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

    return res.status(200).json(messages || []);
  } catch (err) {
    console.error("Error in get_messages:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
      message: "Error fetching messages",
    });
  }
};
