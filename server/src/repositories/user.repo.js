import db from "../libs/db.js";

export class userRepository {
  static async userExists(cmd) {
    const result = await db.query(
      "select exists (select 1 from users where username = $1)",
      [cmd.username]
    );

    return result.rows[0].exists;
  }
}
