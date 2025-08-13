import jwt from "jsonwebtoken";
import { authDto } from "../dtos/user.dto.js";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma.util.js";

export const sign_up = async (req, res) => {
  try {
    const input = new authDto(req.body);
    if (!input.email || !input.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });
    if (existingUser) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const salt_rounds = 10;
    const hashed_password = await bcrypt.hash(input.password, salt_rounds);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: hashed_password
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    console.log("User signed up successfully.: ", user);

    return res.status(201).json({
      message: "User signed up successfully.",
      data: user
    });;

  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign-up :\n " + err.stack || err,
    });
  }
};

export const sign_in = async (req, res) => {
  try {
    const input = new authDto(req.body);

    if (!input.email || !input.password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        signed_in: false,
        message: "Password didn't match"
      });
    }

    return res.status(200).json({
      signed_in: true,
      user: {
        googleId: user.googleId ?? null,
        email: user.email,
        name: user.name ?? null
      }
    });

  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong with /sign-in"
    });
  }
};

export const oauth_signin = async (req, res) => {
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

export const sign_out = async (_req, res) => {
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
