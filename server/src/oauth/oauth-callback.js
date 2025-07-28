import jwt from "jsonwebtoken";
import db from "../config/db.config.js";
import { OAuth2Client } from "google-auth-library";
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import {
  REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
} from "../server.js";

export const oauthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    throw new Error(
      "Authorization code from the authorization server is required"
    );
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      throw new Error(
        `Failed to fetch token from https://oauth2.googleapis.com/token, status: ${tokenRes.status} - ${errorBody}`
      );
    }

    const tokenData = await tokenRes.json();

    const { id_token, refresh_token } = tokenData;

    if (!id_token || !refresh_token) {
      throw new Error("Missing id_token or refresh_token");
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      throw new Error("Failed to verify the token");
    }

    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture } = payload;

    if (!googleId || !email || !name || !picture) {
      throw new Error("Missing data in payload");
    }

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
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: "2d" });

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

    return res.redirect("/profile");
  } catch (err) {
    console.error("OAuth Error:", err);
    res.status(500).send("Authentication failed");
  }
};
