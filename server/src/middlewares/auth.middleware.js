import jwt from "jsonwebtoken";

export async function protectedRoute(req, res, next) {
  try {
    const token = req.cookies.jwt;

    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
