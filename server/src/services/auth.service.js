import { authRepository } from "../repositories/auth.repository.js";
import { serviceResponse } from "../utils/service-response.util.js";
import { jwtService } from "./jwt.service.js";

export class authService {
  static async signUp(input) {
    const userExists = await authRepository.userExists(input);
    if (userExists) {
      return serviceResponse(400, { message: "User already exists" });
    } else {
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
