import jwt from "jsonwebtoken";

export class jwtService {
  static async generateJWT(user) {
    var token = jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    return token;
  }

  static async verifyJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithm: "HS256",
    }).username;
  }
}

