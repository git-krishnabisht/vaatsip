import { refreshGoogleToken } from "../oauth/oauth.refresh-google-token.js";
import jwt from "jsonwebtoken";
import db from "../config/db.config.js";

export async function protectedRoute(req, res, next) {
  const token = req.cookies.jwt;

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // JWT refreshing on expiry
    if (err.name === "TokenExpiredError") {
      const googleId = req.cookies.googleId;
      if (!googleId) return res.sendStatus(401);

      const result = await db.query(
        "select * from users WHERE google_id = $1",
        [googleId]
      );

      if (result.rows.length > 0) {
        const refreshToken = result.rows[0].refresh_token;
        if (refreshToken) {
          const refreshedData = await refreshGoogleToken(refreshToken);

          if (refreshedData.id_token) {
            const payload = jwt.decode(refreshedData.id_token);
            const newToken = jwt.sign(
              {
                googleId: payload.sub,
                email: payload.email,
                name: payload.name,
              },
              process.env.JWT_SECRET,
              { expiresIn: "1h" }
            );

            res.cookie("jwt", newToken, {
              httpOnly: true,
              secure: false,
              sameSite: "lax",
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            req.user = {
              googleId: payload.sub,
              email: payload.email,
              name: payload.name,
            };
            return next();
          }
        }
      }
      return res.sendStatus(401);
    }
    return res.sendStatus(403);
  }
}
