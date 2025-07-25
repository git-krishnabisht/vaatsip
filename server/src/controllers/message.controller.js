import db from "../config/db.config.js";
import imageType from "image-type";
import { getReceiverSocketId, io } from "../socket/socket.js";

function encode64(image, type) {
  if (!image || !type) return { success: false, data: undefined };
  return {
    success: true,
    data: `data:${type};base64,${image.toString("base64")}`,
  };
}

export const sendMessages = async (req, res) => {
  try {
    const {
      username: sender,
      params: { receiver },
      body: { message },
      file,
    } = req;

    if (!sender || !receiver) {
      return res.status(400).json({
        error: "You much provide both sender username and receiver username",
      });
    }
    if (!message && !file) {
      return res
        .status(400)
        .json({ error: "You must provide a message or a valid image." });
    }

    await db.query("BEGIN");
    const messageQuery = await db.query(
      "INSERT INTO messages(sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
      [sender, receiver, message || null]
    );

    const { created_at, message_id: messageId } = messageQuery.rows[0];
    let image = null;
    let type = null;
    let base64Image = null;

    if (file) {
      image = file.buffer;
      type = file.mimetype;
      const attachmentQuery = await db.query(
        "INSERT INTO attachments(message_id, image_data, image_type) VALUES ($1, $2, $3) RETURNING *",
        [messageId, image, type]
      );

      image = attachmentQuery.rows[0].image_data;

      let _encoding = encode64(image, type);
      if (!_encoding.success || !_encoding.data) {
        return res
          .status(400)
          .json({ error: "You must provide valid image data and type." });
      }
      base64Image = _encoding.data;
    }

    await db.query("COMMIT");
    const socketId = getReceiverSocketId(receiver);
    if (socketId) {
      const msg = messageQuery.rows[0].message;
      io.to(socketId).emit("newMessage", {
        msg,
        base64Image,
        sender,
        receiver,
        created_at,
      });
      console.log(
        "Message sent successfully from the socket's server to :",
        receiver
      );
    }

    return res.status(200).json({
      sender,
      receiver,
      message,
      image_data: base64Image,
      created_at,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Send message error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send message",
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const sender = req.username;
    const receiver = req.params.user;

    const query = await db.query(
      `
      SELECT 
        m.message, 
        a.image_data, 
        m.sender, 
        m.receiver, 
        m.created_at 
      FROM messages m
      LEFT JOIN attachments a ON m.message_id = a.message_id 
      WHERE (m.sender = $1 AND m.receiver = $2) 
         OR (m.sender = $2 AND m.receiver = $1) 
      ORDER BY m.created_at
    `,
      [sender, receiver]
    );

    const rows = query.rows;

    const messagesWithBase64 = rows.map((row) => {
      if (!row.image_data) {
        return {
          message: row.message,
          image_data: null,
          sender: row.sender,
          receiver: row.receiver,
          created_at: row.created_at,
        };
      }

      const type = imageType(row.image_data)?.mime || "image/jpeg";
      const base64Image = encode64(row.image_data, type);

      return {
        message: row.message,
        image_data: base64Image,
        sender: row.sender,
        receiver: row.receiver,
        created_at: row.created_at,
      };
    });

    return res.status(200).json(messagesWithBase64);
  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve messages",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
