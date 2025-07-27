import { authService } from "../services/auth.service.js";
import { userValidation } from "../validators/user.validation.js";
import jwt from "jsonwebtoken";

export const signUp = async (req, res) => {
  try {
    const input = req.body;
    const validation = await userValidation(input, "signup");

    if (!validation.isValid) {
      return res.status(400).json(validation.errors);
    }

    const output = await authService.signUp(input);
    return res.status(output.status).json(output.body);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-up :\n " + err.stack || err,
    });
  }
};

export const signIn = async (req, res) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) return res.redirect("/profile");
      res.send('<a href="/auth/google">Login with Google</a>');
    });
  } else {
    res.send('<a href="/auth/google">Login with Google</a>');
  }
};
