import db from "../config/db.config.js";
import { commService } from "../services/comm.service.js";

export const sendMessages = async (req, res) => {
  try {
    const sender = req.user.googleId;
    const {
      params: { receiver },
      body: { message },
      file,
    } = req;

    const output = await commService.sendMessage({
      sender,
      receiver,
      message,
      file,
    });

    if (output.status === 200) {
      return res.status(output.status).json(output.body);
    }

    await db.query("ROLLBACK");

    return res.status(400).json({
      sucess: false,
      error: "Failed to send message",
      data: output,
      message: null,
    });
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Send message error:", err);
    return res.status(500).json({
      success: false,
      error: "Failed to send message",
      data: null,
      message: null,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const sender = req.user?.googleId;
    const receiver = req.params.user;

    if (!sender || !receiver) {
      return res.status(400).json({
        success: false,
        error: "Sender or receiver is missing",
        data: null,
        message: null,
      });
    }

    const output = await commService.getMessages({ sender, receiver });
    return res.status(output.status).json(output.body);
  } catch (err) {
    console.error("Get messages error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal server error",
      data: null,
      message: null,
    });
  }
};
