import { userRepository } from "../repositories/user.repository.js";
import db from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { serviceResponse } from "../utils/service-response.util.js";

export class authService {
  static async signUp(input) {
    const userExists = await userRepository.userExists(input);
    if (userExists) {
      return serviceResponse(400, { message: "User already exists" });
    } else {
      const result = await userRepository.postDetails(input);

      if (result.success) {
        return serviceResponse(200, { message: "Registration successfull" });
      } else {
        return serviceResponse(400, { message: "Registration failed" });
      }
    }
  }

  static async signIn(input) {
    const userExists = await userRepository.userExists(input);
    if (userExists === false) {
      return serviceResponse(400, { message: "User does not exists" });
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

        return serviceResponse(200, {
          token: token,
          message: "Sign in successfull",
        });
      } else {
        return serviceResponse(400, {
          message: "Sign in failed",
        });
      }
    }
  }
}
