import { userRepository } from "../repositories/user.repo.js";
import { signUpCommand } from "../cmd-patterns/signup.cmd.js";
import db from "../libs/db.js";

export class userService {
  static async signUp(input) {
    const userExists = await userRepository.userExists(input);
    if (userExists) {
      return {
        status: 400,
        body: { message: "User already exists" },
      };
    } else {
      const cmd = new signUpCommand(
        input.username,
        input.name,
        input.email,
        input.gender,
        input.dob,
        input.password
      );

      const query = {
        text: "insert into users (username, name, email, gender, dob, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        values: cmd.toArray(),
      };

      const result = await db.query(query);

      if (result.rowCount) {
        return {
          status: 201,
          body: { message: "Registered successfully" },
        };
      } else {
        return {
          status: 400,
          body: { error: "Registration failed" },
        };
      }
    }
  }
}
