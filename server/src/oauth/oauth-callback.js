import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import {
  REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  JWT_SECRET,
} from "../server.js";
import prisma from "../utils/prisma.util.js";
import { jwtService } from "../utils/jwt.util.js";

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

    const { id_token } = tokenData;

    if (!id_token) {
      throw new Error("Missing id_token");
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    if (!ticket) {
      throw new Error("Failed to verify the token");
    }

    const payload = ticket.getPayload();

    const { email, name, picture } = payload;

    if (!email || !name || !picture) {
      throw new Error("Missing data in payload");
    }

    const result = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    let userId;
    if (!result) {
      const newUser = await prisma.user.create({
        data: {
          email,
          avatar: picture,
          name,
          passwordHash: null,
        },
      });
      userId = newUser.id;
    } else {
      userId = result.id;
    }

    const user = { id: userId, email, name };
    const token = await jwtService.generateJWT(user);

    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.redirect(
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URI
        : "http://localhost:5173/"
    );
  } catch (err) {
    console.error("OAuth Error:", err);
    return res.redirect(
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URI}/?error=auth_failed`
        : "http://localhost:5173/?error=auth_failed"
    );
  }
};
