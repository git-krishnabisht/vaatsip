import prisma from "../utils/prisma.util.js";

export const getMessages = async (req, res) => {
  try {
    const user = req.user; 
    if (!user) throw new Error("No user");

    const receiver = req.params.id;

    if (!receiver) throw new Error("No receiver");

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: parseInt(receiver) },
          { senderId: parseInt(receiver), receiverId: user.id },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
        receiver: {
          select: { id: true, name: true, avatar: true },
        },
        attachments: true,
      },
    });

    return res.status(200).json({ body: messages });
  } catch (err) {
    console.error("Error in get_messages:", err);
    return res
      .status(500)
      .json({ error: err.message, message: "Error fetching messages" });
  }
};
