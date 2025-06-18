import { authService } from "../services/auth.service.js";
import { userValidation } from "../validators/user.validation.js";

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
  try {
    const input = req.body;
    const validation = await userValidation(input, "signin");

    if (!validation.isValid) {
      return res.status(400).json(validation.errors);
    }

    const output = await authService.signIn(input);
    return res.status(output.status).json(output.body);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-in :\n " + err.stack || err,
    });
  }
};
