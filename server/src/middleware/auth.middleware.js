import jwt from "jsonwebtoken";
import db from "../lib/db.js";
export const protectedRoute = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Authorization header is missing or invalid" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Token is not available in the authorization header" });
    }
    
    const me = jwt.verify(token, process.env.PUBLIC_KEY, { algorithm: "RS256" }).username;
    const query = await db.query(
      "SELECT CASE WHEN EXISTS (SELECT 1 FROM users WHERE username = $1) THEN true ELSE false END AS is_valid",
      [me]
    );

    if (!query.rows[0].is_valid) {
      return res.status(400).json({ message: "No user found" });
    }

    req.username = me;
    next(); 
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the is-valid middleware \n " + err.stack || err });
  }
};
