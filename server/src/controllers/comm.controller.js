import db from "../config/db.config.js";
import imageType from "image-type";
import { encode64 } from "../utils/encode-base64.util.js";
import { commRepository } from "../repositories/comm.repository.js";
import { notifyUserMessage } from "../utils/socket.notify-user.util.js";

export const sendMessages = async (req, res) => {
  try {
    const sender = req.user.googleId;
    const {
      params: { receiver },
      body: { message },
      file,
    } = req;

    if (!sender || !receiver) {
      return res.status(400).json({
        error: "You much provide both sender username and receiver username",
      });
    }

    // check sender and reciever existense in DB

    if (!message && !file) {
      return res
        .status(400)
        .json({ error: "You must provide a message or a valid image." });
    }

    await db.query("BEGIN");

    const messageQuery = await commRepository.insertMessage(
      sender,
      receiver,
      message
    );

    const { created_at, message_id: messageId } = messageQuery.rows[0];

    let image = null;
    let type = null;
    let base64Image = null;

    if (file) {
      image = file.buffer;
      type = file.mimetype;
      const attachmentQuery = await commRepository.insertAttachments(
        messageId,
        image,
        type
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

    notifyUserMessage({
      sender,
      receiver,
      message,
      image: base64Image,
      created_at,
    });

    const responsePayload = {
      sender,
      receiver,
      message,
      created_at,
    };

    if (base64Image) {
      responsePayload.image_data = base64Image;
    }

    return res.status(200).json(responsePayload);
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
    const sender = req.user?.googleId;
    const receiver = req.params.user;

    // check sender and receiver existence in DB

    const query = await commRepository.getMessages(sender, receiver);
    const rows = query.rows;

    const messagesWithBase64 = parseMessageList(rows);
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

function parseMessageList(rows) {
  const list = rows.map((row) => {
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

  return list;
}
