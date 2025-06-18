import { userService } from "../services/user.service.js";
import { userValidation } from "../validators/user.validation.js";

export const signIn = async (req, res) => {
  try {
    const input = req.body;
    const validation = await userValidation(input, "signin");

    if (!validation.isValid) {
      return res.status(400).send(validation.errors);
    }

    const result = await userService.signIn(input);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-in :\n " + err.stack || err,
    });
  }
};

export const signUp = async (req, res) => {
  try {
    const input = req.body;

    const validation = await userValidation(input, "signup");
    if (!validation.isValid) {
      return res.status(400).send(validation.errors);
    }

    const result = await userService.signUp(input);
    return res.status(result.status).send(result.body);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-up :\n " + err.stack,
    });
  }
};
