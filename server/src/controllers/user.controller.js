import { fileTypeFromBuffer } from "file-type";
import imageType from "image-type";
import prisma from "../utils/prisma.util.js";
import jwt from "jsonwebtoken";

export const getPictures = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(400).json({ message: "email not found" });
    }

    const user = await prisma.user.findUnique({
      where: { id: id },
      select: { avatar: true }
    });

    if (!user || !user.avatar) {
      return res.status(404).json({ message: "No image found for this user" });
    }

    const img = user.avatar;
    if (!img) {
      return res
        .status(404)
        .json({ message: "No image found from the result query" });
    }

    const fileType = await fileTypeFromBuffer(img);
    res.setHeader("Content-Type", fileType.mime);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${user.name}-img.${fileType.ext}"`
    );
    res.send(img);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /get-pictures :\n " + err.stack,
    });
  }
};

export const userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.avatar) return res.status(200).json({ details: user });

    const type = imageType(user.avatar)?.mime || "image/jpeg";
    const base64Image = `data:${type};base64,${user.avatar.toString(
      "base64"
    )}`;
    const userdetails = { ...user, avatar: base64Image };
    return res.status(200).json({ details: userdetails });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /user-details : " + err.stack || err,
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    });

    return res.status(200).json({ data: users });
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /get-users :\n " + err.stack,
    });
  }
};

export const uploadProfile = async (req, res) => {
  try {
    const email = req.email;
    const checkUser = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true }
    });

    if (!checkUser) {
      return res.status(404).json({ error: "User does not exist" });
    }

    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ error: "No image file found in the request" });
    }

    const image = req.file.buffer;
    const result = await prisma.user.update({
      where: { email: email },
      data: { avatar: image },
      select: { email: true }
    });

    if (result) {
      return res.status(200).json({
        message: "Image uploaded successfully",
        email: result.email,
      });
    } else {
      return res.status(500).json({ error: "Failed to update user profile" });
    }
  } catch (err) {
    return res.status(500).json({
      error: `Error processing the upload-profile request: ${err.message}`,
    });
  }
};

export const getUser = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "No token found" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    return res.status(200).json({ user: decoded });
  } catch (err) {
    return res.status(400).send({ error: "Failed to get the user" });
  }
};

export const userDelete = async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ message: "Username not found" });
  }
  try {
    const result = await prisma.user.delete({
      where: { id: id }
    });

    if (result) {
      return res.status(200).send({ message: "User deleted successfully" });
    } else {
      return res.status(400).send({ message: "Deletion failed" });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /user-delete :\n " + err.stack,
    });
  }
};

export const userUpdate = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({ message: "Provide correct information" });
  }

  try {
    const result = await prisma.user.update({
      where: { email: email },
      data: { passwordHash: password }
    });

    if (result) {
      return res.status(200).send({ message: "Update successful" });
    } else {
      return res.status(400).send({ message: "Update failed" });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /user-update :\n " + err.stack,
    });
  }
};
