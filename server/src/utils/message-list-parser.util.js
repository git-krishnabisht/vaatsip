import { encode64 } from "./encode-base64.util.js";
import imageType from "image-type"; // if you use this

export function parseMessageList(rows) {
  return rows.map((row) => {
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
      image_data: base64Image.data,
      sender: row.sender,
      receiver: row.receiver,
      created_at: row.created_at,
    };
  });
}
