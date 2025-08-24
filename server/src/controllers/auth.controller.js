import jwt from "jsonwebtoken";
import { authDto, signUpDto } from "../dtos/user.dto.js";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma.util.js";
import { jwtService } from "../utils/jwt.util.js";

export const sign_up = async (req, res) => {
  try {
    const input = new signUpDto(req.body);

    if (!input.email || !input.password || !input.name) {
      return res.status(400).json({ error: "All credentials are required" });
    }

    const email = input.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    let user;

    const salt_rounds = 10;
    let hashed_password;

    if (existingUser && existingUser.passwordHash !== null) {
      return res.status(409).json({
        error:
          "User is already registered. Please sign in or reset your password.",
      });
    } else if (existingUser && existingUser.passwordHash === null) {
      hashed_password = await bcrypt.hash(input.password, salt_rounds);

      user = await prisma.user.update({
        where: { email },
        data: { passwordHash: hashed_password },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    } else if (!existingUser) {
      hashed_password = await bcrypt.hash(input.password, salt_rounds);

      user = await prisma.user.create({
        data: { name: input.name, email, passwordHash: hashed_password },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    }

    const token = jwtService.generateJWT({ id: user.id, email: user.email });

    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res
      .status(201)
      .json({ signed_up: true, message: "User signed up successfully" });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign_up:\n" + (err.stack || err),
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
      where: { email: input.email },
    });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        signed_in: false,
        message: "Password didn't match",
      });
    }

    const token = await jwtService.generateJWT({
      id: user.id,
      email: user.email,
    });

    res.cookie("jwt", token, {
      httpOnly: false,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      signed_in: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong with /sign_in",
    });
  }
};

export const sign_out = async (_req, res) => {
  try {
    res.clearCookie("jwt");

    return res.status(200).json({
      body: {
        signed_in: false,
        message: "Logged out successfully",
      },
    });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /sign_out :\n " + err.stack || err,
    });
  }
};

export const oauth_signin = async (req, res) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(404).json({
        body: {
          signed_in: false,
          message: "No authentication token found",
        },
      });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(400).json({
          body: {
            signed_in: false,
            message: "Invalid or expired token",
          },
        });
      }

      return res.status(200).json({
        body: {
          signed_in: true,
          user: {
            id: decoded.id,
            email: decoded.email,
          },
        },
      });
    });
  } catch (err) {
    return res.status(500).json({
      error:
        "Something is wrong with the /oauth_signin :\n " + err.stack || err,
    });
  }
};
