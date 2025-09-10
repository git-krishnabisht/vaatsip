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
  };

  
  if (isProduction && process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  console.log("Final cookie options:", options);
  return options;
};


const clearAuthCookies = (res) => {
  const cookieOptions = getCookieOptions();
  const cookiesToClear = ["jwt", "authToken", "token", "access_token"];

  cookiesToClear.forEach((cookieName) => {
    
    res.cookie(cookieName, "", {
      ...cookieOptions,
      expires: new Date(0),
      maxAge: 0,
    });

    
    res.clearCookie(cookieName, { path: "/" });

    
    if (process.env.NODE_ENV === "production" && process.env.COOKIE_DOMAIN) {
      res.clearCookie(cookieName, {
        path: "/",
        domain: process.env.COOKIE_DOMAIN,
        secure: true,
        sameSite: "none",
      });
    }
  });
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

    
    res.cookie("token", token, cookieOptions);
    res.cookie("access_token", token, cookieOptions);

    console.log(`User ${user.email} signed up successfully`);
    console.log("JWT token length:", token.length);
    console.log("Token preview:", token.substring(0, 20) + "...");
    console.log("Cookie options used:", cookieOptions);

    return res.status(201).json({
      signed_up: true,
      message: "User signed up successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      ...(process.env.NODE_ENV !== "production" && {
        debug: {
          cookieSet: true,
          tokenLength: token.length,
          cookieOptions,
          tokenPreview: token.substring(0, 30) + "...",
        },
      }),
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
      where: { email: input.email.toLowerCase() },
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

    const token = jwtService.generateJWT({
      id: user.id,
      email: user.email,
    });

    const cookieOptions = getCookieOptions();

    
    res.cookie("jwt", token, cookieOptions);
    res.cookie("token", token, cookieOptions);
    res.cookie("access_token", token, cookieOptions);

    console.log(`User ${user.email} signed in successfully`);
    console.log("JWT token length:", token.length);
    console.log("Token preview:", token.substring(0, 20) + "...");
    console.log("Cookie options used:", cookieOptions);

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
          tokenPreview: token.substring(0, 30) + "...",
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
    clearAuthCookies(res);

    console.log("User signed out, all authentication cookies cleared");

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
    console.log("=== OAuth Sign In Debug ===");
    console.log("All cookies received:", req.cookies);
    console.log("Cookie header:", req.headers.cookie);

    
    const possibleTokens = ["jwt", "token", "access_token", "authToken"];
    let token = null;
    let tokenSource = null;

    for (const tokenName of possibleTokens) {
      if (req.cookies[tokenName]) {
        token = req.cookies[tokenName];
        tokenSource = tokenName;
        console.log(`Found token in cookie: ${tokenName}`);
        break;
      }
    }

    console.log(
      "JWT token:",
      token ? `${token.substring(0, 20)}...` : "NOT FOUND"
    );
    console.log("Token source:", tokenSource);

    if (!token) {
      console.log("No authentication token found in any cookie");
      return res.status(404).json({
        body: {
          signed_in: false,
          message: "No authentication token found",
        },
      });
    }

    
    if (typeof token !== "string" || token.split(".").length !== 3) {
      console.log("Invalid JWT token format");
      clearAuthCookies(res);
      return res.status(401).json({
        body: {
          signed_in: false,
          message: "Invalid token format",
        },
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id || !decoded.email) {
        throw new Error("Invalid token payload");
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, name: true, avatar: true },
      });

      if (!user) {
        console.log("User not found in database for decoded token");
        clearAuthCookies(res);
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
      console.error("Token that failed:", token.substring(0, 50) + "...");

      clearAuthCookies(res);

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

export const oauthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) {
    console.error("No authorization code received");
    return res.redirect(
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URI}/auth-google?error=auth_failed`
        : "http://localhost:5173/auth-google?error=auth_failed"
    );
  }

  try {
    
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error("Token exchange failed:", errorBody);
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    const { id_token } = tokenData;

    if (!id_token) {
      throw new Error("Missing id_token in response");
    }

    
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

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
    } else if (picture && user.avatar !== picture) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: picture },
      });
    }

    
    const jwtPayload = { id: user.id, email: user.email };
    const token = jwtService.generateJWT(jwtPayload);
    const cookieOptions = getCookieOptions();

    
    res.cookie("jwt", token, cookieOptions);
    res.cookie("token", token, cookieOptions);
    res.cookie("access_token", token, cookieOptions);

    console.log(`OAuth successful for user ${user.email}`);
    console.log("JWT token length:", token.length);
    console.log("Token preview:", token.substring(0, 20) + "...");
    console.log("Cookie options used:", cookieOptions);

    const redirectUrl =
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URI
        : "https://localhost:5173";

    console.log(`Redirecting to ${redirectUrl}`);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("OAuth Error:", err);
    const errorRedirectUrl =
      process.env.NODE_ENV === "production"
        ? `${process.env.FRONTEND_URI}/auth-google?error=auth_failed`
        : "https://localhost:5173/auth-google?error=auth_failed";

    return res.redirect(errorRedirectUrl);
  }
};
