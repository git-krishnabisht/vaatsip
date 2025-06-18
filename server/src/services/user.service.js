import { userRepository } from "../repositories/user.repository.js";
import db from "../config/db.config.js";
import jwt from "jsonwebtoken";

export class userService {
  static async signUp(input) {
    const userExists = await userRepository.userExists(input);
    if (userExists) {
      return {
        status: 400,
        body: { message: "User already exists" },
      };
    } else {
      const query = {
        text: "insert into users (username, name, email, gender, dob, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
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

  static async signIn(input) {
    const userExists = await userRepository.userExists(input);
    if (userExists === false) {
      return {
        status: 400,
        body: { message: "User doesn't exists" },
      };
    } else {
      const query = {
        text: "select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;",
        values: [input.username, input.password],
      };

      const result = await db.query(query);
      console.log("result: ", result);

      if (result.rows[0].is_valid) {
        var token = jwt.sign(
          { username: input.username },
          process.env.PRIVATE_KEY,
          { expiresIn: "7d", algorithm: "RS256" }
        );

        return {
          status: 200,
          body: {
            token: token,
            message: "Sign in successfull",
          },
        };
      } else {
        return {
          status: 400,
          body: { message: "Sign in failed" },
        };
      }
    }
  }
}
