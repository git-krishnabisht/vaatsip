import jwt from "jsonwebtoken";
import db from "../config/db.config.js";

export const testLogout = async (req, res) => {
  const token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const googleId = decoded.googleId;

      await db.query(
        "update users set refresh_token = NULL where google_id = $1",
        [googleId]
      );
    } catch (err) {
      console.error("Logout error:", err);
    }
  }

  res.clearCookie("jwt");
  res.clearCookie("googleId");
  res.redirect("/");
};
