import jwt from "jsonwebtoken";

import { REDIRECT_URI, GOOGLE_CLIENT_ID, JWT_SECRET } from "../server.js";

export const oauthEntry = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (token) {
      jwt.verify(token, JWT_SECRET, (err) => {
        if (!err) return res.redirect("/profile");
      });
    }

    const scope = ["profile", "email"].join(" ");
    const redirectUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    return res.redirect(redirectUrl);
  } catch (err) {
    return res.send({ body: { success: false } });
  }
};
