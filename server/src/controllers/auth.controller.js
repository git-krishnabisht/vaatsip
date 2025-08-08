import { authService } from "../services/auth.service.js";
import { userValidation } from "../validators/user.validation.js";
import jwt from "jsonwebtoken";
import { SignUpDTO } from "../dtos/user.dto.js";

export const signUp = async (req, res) => {
  try {
    const input = new SignUpDTO(req.body);
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
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(200).json({
        body: {
          signed_in: false,
          message: "No authentication token found"
        }
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(200).json({
          body: {
            signed_in: false,
            message: "Invalid or expired token"
          }
        });
      }

      return res.status(200).json({
        body: {
          signed_in: true,
          user: {
            googleId: decoded.googleId,
            email: decoded.email,
            name: decoded.name
          }
        }
      });
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-in :\n " + err.stack || err,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('jwt');
    res.clearCookie('googleId');

    return res.status(200).json({
      body: {
        signed_in: false,
        message: "Logged out successfully"
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /logout :\n " + err.stack || err,
    });
  }
};
