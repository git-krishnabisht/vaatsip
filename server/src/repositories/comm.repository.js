import db from "../config/db.config.js";

export class commRepository {
  static async insertMessage(sender, receiver, message) {
    return await db.query(
      "INSERT INTO messages(sender, receiver, message) VALUES ($1, $2, $3) RETURNING *",
      [sender, receiver, message || null]
    );
  }

  static async insertAttachments(messageId, image, type) {
    return await db.query(
      "INSERT INTO attachments(message_id, image_data, image_type) VALUES ($1, $2, $3) RETURNING *",
      [messageId, image, type]
    );
  }

  static async getMessages(sender, receiver) {
    return await db.query(
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
  }
}
