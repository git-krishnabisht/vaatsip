import jwt from "jsonwebtoken";

export class jwtService {
  static async generateJWT(username) {
    var token = jwt.sign({ username: username }, process.env.PRIVATE_KEY, {
      expiresIn: "7d",
      algorithm: "RS256",
    });

    return token;
  }

  static async verifyJWT(token) {
    return jwt.verify(token, process.env.PUBLIC_KEY, {
      algorithm: "RS256",
    }).username;
  }
}
