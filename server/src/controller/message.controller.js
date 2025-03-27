import db from "../lib/db.js";
import imageType from "image-type";
import { io } from "../socket/socket.js";
import { receiverSocket } from "../socket/socket.js";

export const getMessages = async (req, res) => {
  try {
    const sender = req.username;
    const receiver = req.params.user;
    
    console.log("point 0");
    const query = await db.query(`
      SELECT 
        c.message, 
        a.image_data, 
        c.sender, 
        c.receiver, 
        c.created_at 
      FROM conversation c 
      LEFT JOIN attachments a ON c.message_id = a.message_id 
      WHERE (c.sender = $1 AND c.receiver = $2) 
         OR (c.sender = $2 AND c.receiver = $1) 
      ORDER BY c.created_at
    `, [sender, receiver]);

    const rows = query.rows;

    const messagesWithBase64 = rows.map(row => {
      if (!row.image_data) {
        return {
          message: row.message,
          image_data: null,
          sender: row.sender,
          receiver: row.receiver,
          created_at: row.created_at
        };
      }

      const type = imageType(row.image_data)?.mime || "image/jpeg";
      const base64Image = `data:${type};base64,${row.image_data.toString("base64")}`;
      return {
        message: row.message,
        image_data: base64Image,
        sender: row.sender,
        receiver: row.receiver,
        created_at: row.created_at
      };
    });

    return res.status(200).json(
      messagesWithBase64
    );

  } catch (err) {
    console.error("Get messages error:", err);
    return res.status(500).json({ 
      success: false,
      error: "Failed to retrieve messages",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

export const sendMessages = async (req, res) => {
  try {
      const { username: sender, params: { receiver }, body: { message }, file } = req;

      if (!sender || !receiver) {
          return res.status(400).json({ error: "Sender and receiver are required" });
      }
      if (!message && !file) {
          return res.status(400).json({ error: "Either message or file must be provided" });
      }

      await db.query('BEGIN');
      const conversationQuery = await db.query(
          "INSERT INTO conversation(sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
          [sender, receiver, message || null]
      );

      const { created_at, message_id: messageId } = conversationQuery.rows[0];
      let image = null;
      let imagetype = null;

      if (file) {
          image = file.buffer;
          imagetype = file.mimetype;
          const attachmentQuery = await db.query(
              "INSERT INTO attachments(message_id, image_data, image_type) VALUES ($1, $2, $3) RETURNING *",
              [messageId, image, imagetype]
          );
          image = attachmentQuery.rows[0].image_data;
      }
      await db.query('COMMIT');
      
      const receiverWs = receiverSocket(receiver);
      if (receiverWs && receiverWs.readyState === 1) { 
        console.log("Sending message via WebSocket to", receiver);
        receiverWs.send(JSON.stringify({
          type: 'message',
          sender,
          receiver,
          message: message || '',
          image: image ? true : false,
          created_at
        }));
      } else {
        console.log("Receiver socket not available or not open:", receiver);undefined,,,
      }

      return res.status(200).json({
          success: true,
          data: { messageId, sender, receiver, message, image: !!image, created_at }
      });

  } catch (err) {
      await db.query('ROLLBACK');
      console.error('Send message error:', err);
      return res.status(500).json({ 
          success: false,
          error: "Failed to send message" 
      });
  }
};