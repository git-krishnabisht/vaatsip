import jwt from "jsonwebtoken";

export async function protectedRoute(req, res, next) {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      console.log("No token provided, returning 401");
      return res.status(401).json({ error: "No token provided" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid or expired tokenn" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
