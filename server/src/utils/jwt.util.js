import jwt from "jsonwebtoken";

export class jwtService {
  static generateJWT(user) {
    return jwt.sign(user, process.env.JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    });
  }

  static verifyJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
  }
}

