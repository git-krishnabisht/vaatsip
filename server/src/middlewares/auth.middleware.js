import jwt from "jsonwebtoken";

export async function protectedRoute(req, res, next) {
  console.log("=== PROTECTED ROUTE MIDDLEWARE CALLED ===");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Request cookies:", req.cookies);
  
  try {
    const token = req.cookies?.jwt;

    console.log("JWT token found:", !!token);

    if (!token) {
      console.log("No token provided, returning 401");
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    console.log("Token decoded successfully:", !!decoded);
    console.log("Decoded user:", decoded);

    req.user = decoded;

    console.log("User attached to request, calling next()");
    return next();
  } catch (err) {
    console.error("JWT verification error:", err);
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid or expired tokenn" });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

