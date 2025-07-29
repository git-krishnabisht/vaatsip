import db from "../config/db.config.js";

export class authRepository {

  static async userExists(googleId) {
    const result = await db.query(
      "select exists (select 1 from users where google_id = $1)",
      [googleId]
    );
    return result.rows[0].exists;
  }

  static async postCredentials(input) {
    const query = {
      text: "insert into users (username, name, email, gender, dob, password) values ($1, $2, $3, $4, $5, $6) returning *",
      values: [
        input.username,
        input.name,
        input.email,
        input.gender,
        input.dob,
        input.password,
      ],
    };

    const result = await db.query(query);
    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false };
    }
  }

  static async verifyCredentials(input) {
    const query = {
      text: "select 1 from users where googleId = $1 and password = $2 limit 1",
      values: [input.username, input.password],
    };

    const result = await db.query(query);

    if (result.rowCount > 0) {
      return { success: true };
    } else {
      return { success: false };
    }
  }
}
