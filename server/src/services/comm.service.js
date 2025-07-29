import { authRepository } from "../repositories/auth.repository.js";
import { serviceResponse } from "../utils/service-response.util.js";
import { commRepository } from "../repositories/comm.repository.js";
import db from "../config/db.config.js";
import { encode64 } from "../utils/encode-base64.util.js";
import { notifyUserMessage } from "../utils/socket.notify-user.util.js";
import imageType from "image-type";
import { parseMessageList } from "../utils/message-list-parser.util.js";

export class commService {
  static async sendMessage({ sender, receiver, message, file }) {
    const sender_valid = authRepository.userExists(sender);
    const receiver_valid = authRepository.userExists(receiver);

    if (!sender_valid || !receiver_valid) {
      return serviceResponse(404, {
        success: false,
        error: "Missing users",
        data: null,
        message: null,
      });
    }

    if (!message && !file) {
      return serviceResponse(404, {
        success: false,
        error: "Missing (message or file)",
        data: null,
        message: null,
      });
    }

    await db.query("BEGIN");

    const _m_query = await commRepository.insertMessage(
      sender,
      receiver,
      message
    );

    const { created_at, message_id } = _m_query.rows[0];

    let image = null;
    let type = null;
    let _base_64_image = null;

    if (file) {
      let image_buffer = file.buffer;
      type = file.mimetype;
      const _a_query = await commRepository.insertAttachments(
        message_id,
        image_buffer,
        type
      );

      image = _a_query.rows[0].image_data;

      let _encode = encode64(image, type);

      if (!_encode.success || !_encode.data) {
        return serviceResponse(400, {
          success: false,
          error: "Invalid image data or image type",
          data: null,
          message: null,
        });
      }

      _base_64_image = _encode.data;
    }

    await db.query("COMMIT");

    notifyUserMessage({
      sender,
      receiver,
      message,
      image: _base_64_image,
      created_at,
    });

    const response_payload = {
      sender,
      receiver,
      message,
      created_at,
    };

    if (_base_64_image) {
      response_payload.image_data = _base_64_image;
    }

    return serviceResponse(200, {
      success: true,
      error: null,
      data: response_payload,
      message: "Message sent sucessfully",
    });
  }

  static async getMessages({ sender, receiver }) {
    const senderExists = await authRepository.userExists(sender);
    const receiverExists = await authRepository.userExists(receiver);

    if (!senderExists || !receiverExists) {
      return serviceResponse(404, {
        success: false,
        error: "Missing users",
        data: null,
        message: null,
      });
    }

    const query = await commRepository.getMessages(sender, receiver);
    const rows = query.rows;

    const message_list = parseMessageList(rows);

    return serviceResponse(200, {
      success: true,
      error: null,
      data: message_list,
      message: "Messages fetched sucessfully from the database",
    });
  }
}
