import { receiverSocketId } from "../lib/socket.js";
import db from "../lib/db.js";
import { io } from "../lib/socket.js";

export const getMessages = async (req, res) => {
  try {
    const sender = req.username;
    const receiver = req.params.user;
    const query = await db.query("select c.message, a.image_data, c.sender, c.receiver, c.created_at from conversation c left join attachments a on c.message_id = a .message_id where (c.sender = $1 and c.receiver = $2) or (c.sender = $2 and c.receiver = $1) order by c.created_at;", [sender, receiver]);
    if (query.rows <= 0) {
      return res.status(400).json({ message: "No messages in the conversation yet" });
    }
    return res.status(200).json([query.rows, sender]);
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the get-messages \n " + err.stack || err });
  }
};

export const sendMessages = async (req, res) => {
  try {
    const sender = req.username;
    const receiver = req.params.receiver;
    const message = req.body.message;
    const file = req.file;
    if (!message && !file) {
      return res.status(400).json({ message: "Either message or an image must be provided" });
    }
    const conversationQuery = await db.query("INSERT INTO conversation(sender, receiver, message) VALUES ($1, $2, $3) RETURNING *", [sender, receiver, message || null]);
    
    const created_at = conversationQuery.rows[0].created_at;
    const messageId = conversationQuery.rows[0]?.message_id;
    let image = null;
    let imagetype = null;
    if (file) {
      image = file.buffer;
      imagetype = file.mimetype;
      const attachmentQuery = await db.query("insert into attachments(message_id, image_data, image_type) values ($1, $2 ,$3) returning *;", [messageId, image, imagetype]);
      image = attachmentQuery.rows[0].image_data;

      if (attachmentQuery.rowCount === 0) {
        return res.status(400).json({ message: "Failed to save attachment" });
      }
    }

    const socketId = receiverSocketId(receiver);
    if (socketId) {
      const msg = conversationQuery.rows[0].message;
      io.to(socketId).emit("newMessage", { msg , image, sender, receiver, created_at });
      console.log("Message sent successfully from the socket's server to :", receiver);
    }

    return res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the send-messages \n " + err });
  }
};
