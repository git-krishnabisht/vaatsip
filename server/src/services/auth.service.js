import { authRepository } from "../repositories/auth.repository.js";
import { serviceResponse } from "../utils/service-response.util.js";
import { jwtService } from "./jwt.service.js";
import bcrypt from "bcrypt";

export class authService {
  static async sign_up_service(input) {
    const userExists = await authRepository.userExists(input.email);
    if (userExists) {
      return serviceResponse(400, { message: "User already exists" });
    } else {
      const salt_rounds = 10;
      const salt = await bcrypt.genSalt(salt_rounds);
      const hash = await bcrypt.hash(password, salt);

      const result = await authRepository.postCredentials(input);

      if (result.success) {
        return serviceResponse(200, { message: "Registration successfull" });
      } else {
        return serviceResponse(400, { message: "Registration failed" });
      }
    }
  }

  static async signIn(input) {
    const userExists = await authRepository.userExists(input);
    if (userExists === false) {
      return serviceResponse(400, { message: "User does not exists" });
    } else {
      const result = await authRepository.verifyCredentials(input);

      if (result.success) {
        var token = await jwtService.generateJWT(input.username);
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
