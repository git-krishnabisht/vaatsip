import jwt from "jsonwebtoken";
import db from "../config/db.config.js";
import { OAuth2Client } from "google-auth-library";
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import { REDIRECT_URI } from "../server.js";

export const oauthCallback = async (req, res) => {
  const code = req.query.code;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const { id_token, refresh_token } = tokenData;

    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;

    const result = await db.query("select * from users where google_id = $1", [
      googleId,
    ]);

    if (result.rows.length === 0) {
      await db.query(
        "insert into users (google_id, email, name, avatar, refresh_token) VALUES ($1, $2, $3, $4, $5)",
        [googleId, email, name, picture, refresh_token || null]
      );
    } else if (refresh_token) {
      await db.query(
        "update users set refresh_token = $1 where google_id = $2",
        [refresh_token, googleId]
      );
    }

    const user = { googleId, email, name };
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "2d" });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("googleId", googleId, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/profile");
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("Authentication failed");
  }
};
