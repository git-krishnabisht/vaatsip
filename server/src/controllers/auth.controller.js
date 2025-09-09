import jwt from "jsonwebtoken";
import { authDto, signUpDto } from "../dtos/user.dto.js";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma.util.js";
import { jwtService } from "../utils/jwt.util.js";

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  console.log("Cookie options - Production:", isProduction);
  console.log("Frontend URI:", process.env.FRONTEND_URI);

  const options = {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(isProduction &&
      process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
  };

  if (isProduction) {
    console.log("Production cookie options:", options);
  }

  return options;
};

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

    const cookieOptions = getCookieOptions();
    res.cookie("jwt", token, cookieOptions);

    console.log(`User ${user.email} signed up successfully`);
    console.log("Cookie set with options:", cookieOptions);
    console.log("Token length:", token.length);

    return res.status(201).json({
      signed_up: true,
      message: "User signed up successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error("Sign up error:", err);
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

    if (!user.passwordHash) {
      return res.status(401).json({
        signed_in: false,
        message:
          "This account was created with Google. Please sign in with Google.",
      });
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

    const cookieOptions = getCookieOptions();
    res.cookie("jwt", token, cookieOptions);

    console.log(`User ${user.email} signed in successfully`);
    console.log("Cookie set with options:", cookieOptions);
    console.log("Token preview:", token.substring(0, 20) + "...");

    return res.status(200).json({
      signed_in: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        avatar: user.avatar ?? null,
      },
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          cookieSet: true,
          tokenLength: token.length,
          cookieOptions,
        },
      }),
    });
  } catch (err) {
    console.error("Sign in error:", err);
    return res.status(500).json({
      error: "Something went wrong with /sign_in",
    });
  }
};

export const sign_out = async (_req, res) => {
  try {
    const cookieOptions = getCookieOptions();

    const clearOptions = {
      ...cookieOptions,
      expires: new Date(0),
      maxAge: 0,
    };
    delete clearOptions.maxAge;

    res.clearCookie("jwt", clearOptions);

    res.clearCookie("jwt", { path: "/" });

    console.log("User signed out, cookies cleared");

    return res.status(200).json({
      body: {
        signed_in: false,
        message: "Logged out successfully",
      },
    });
  } catch (err) {
    console.error("Sign out error:", err);
    return res.status(500).json({
      error: "Something is wrong with the /sign_out :\n " + (err.stack || err),
    });
  }
};

export const oauth_signin = async (req, res) => {
  try {
    const token = req.cookies.jwt;

    console.log("=== OAuth Sign In Debug ===");
    console.log("Cookies received:", req.cookies);
    console.log(
      "JWT token:",
      token ? `${token.substring(0, 20)}...` : "NOT FOUND"
    );

    if (!token) {
      return res.status(404).json({
        body: {
          signed_in: false,
          message: "No authentication token found",
        },
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, avatar: true },
      });

      if (!user) {
        return res.status(404).json({
          body: {
            signed_in: false,
            message: "User not found",
          },
        });
      }

      console.log(`OAuth verification successful for user: ${user.email}`);

      return res.status(200).json({
        body: {
          signed_in: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
          },
        },
      });
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError.message);

      const cookieOptions = getCookieOptions();
      const clearOptions = { ...cookieOptions, expires: new Date(0) };
      delete clearOptions.maxAge;
      res.clearCookie("jwt", clearOptions);

      return res.status(401).json({
        body: {
          signed_in: false,
          message: "Invalid or expired token",
        },
      });
    }
  } catch (err) {
    console.error("OAuth signin error:", err);
    return res.status(500).json({
      error:
        "Something is wrong with the /oauth_signin :\n " + (err.stack || err),
    });
  }
};
