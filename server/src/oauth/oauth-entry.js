import jwt from "jsonwebtoken";
import { REDIRECT_URI } from "../server.js";

export const oauthEntry = async (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (!err) return res.redirect("/profile");
    });
  }

  const scope = ["profile", "email"].join(" ");
  const redirectUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scope)}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(redirectUrl);
};
