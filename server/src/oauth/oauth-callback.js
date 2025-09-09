import { OAuth2Client } from "google-auth-library";
const oauthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
import {
  REDIRECT_URI,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "../server.js";
import prisma from "../utils/prisma.util.js";
import { jwtService } from "../utils/jwt.util.js";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: false, // Allow client-side access for WebSocket
    secure: isProduction, // Only use secure cookies in production
    sameSite: isProduction ? "none" : "lax", // Cross-site cookies in production
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: isProduction ? ".vercel.app" : undefined, // Set domain for Vercel in production
    path: "/", // Available on all paths
  };
};

export const oauthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    console.error("No authorization code received");
    return res.redirect(
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URI}/auth-google?error=auth_failed`
        : "http://localhost:4173/auth-google?error=auth_failed"
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
      console.error("Token exchange failed:", errorBody);
      throw new Error(
        `Failed to fetch token from https://oauth2.googleapis.com/token, status: ${tokenRes.status} - ${errorBody}`
      );
    }

    const tokenData = await tokenRes.json();
    const { id_token } = tokenData;

    if (!id_token) {
      throw new Error("Missing id_token in response");
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

    if (!email || !name) {
      throw new Error("Missing required user data in payload");
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          avatar: picture || null,
          name,
          passwordHash: null,
        },
      });
    } else {
      if (picture && user.avatar !== picture) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: picture },
        });
      }
    }

    const jwtPayload = { id: user.id, email: user.email };
    const token = await jwtService.generateJWT(jwtPayload);

    res.cookie("jwt", token, getCookieOptions());

    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URI
        : "http://localhost:4173";

    console.log(
      `OAuth successful for user ${user.email}, redirecting to ${redirectUrl}`
    );

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth Error:", err);

    const errorRedirectUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URI}/auth-google?error=auth_failed`
        : "http://localhost:4173/auth-google?error=auth_failed";

    return res.redirect(errorRedirectUrl);
  }
};
