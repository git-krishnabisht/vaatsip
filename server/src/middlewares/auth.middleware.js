import jwt from "jsonwebtoken";

export async function protectedRoute(req, res, next) {
  try {
    const token = req.cookies?.jwt;
    if (!token) {
      console.log("No token provided, returning 401");
      return res.status(401).json({ error: "No token provided" });
    }

    if (typeof token !== 'string' || token.length < 10) {
      return res.status(401).json({ error: "Invalid token format" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    
    if (!decoded || !decoded.id || !decoded.email) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }

    console.error("Auth middleware error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
