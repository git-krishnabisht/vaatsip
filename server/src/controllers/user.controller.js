import { fileTypeFromBuffer } from "file-type";
import imageType from "image-type";
import prisma from "../utils/prisma.util.js";

export const getPictures = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { avatar: true, name: true },
    });

    if (!user || !user.avatar) {
      return res.status(404).json({ message: "No image found for this user" });
    }

    const fileType = await fileTypeFromBuffer(user.avatar);
    if (!fileType || !fileType.mime.startsWith("image/")) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    res.setHeader("Content-Type", fileType.mime);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${user.name || "user"}-img.${fileType.ext}"`
    );
    res.send(user.avatar);
  } catch (err) {
    console.error("Error in getPictures:", err);
    return res.status(500).json({
      error: "Failed to retrieve user picture",
    });
  }
};

export const userDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let userDetails = { ...user };

    if (user.avatar) {
      try {
        let avatarBuffer;

        if (Buffer.isBuffer(user.avatar)) {
          avatarBuffer = user.avatar;
        } else if (typeof user.avatar === "string") {
          if (user.avatar.startsWith("data:")) {
            userDetails.avatar = user.avatar;
            return res.status(200).json({ details: userDetails });
          } else if (user.avatar.startsWith("http")) {
            userDetails.avatar = user.avatar;
            return res.status(200).json({ details: userDetails });
          } else {
            avatarBuffer = Buffer.from(user.avatar, "base64");
          }
        } else {
          console.error(
            "Unexpected avatar type for user",
            user.id,
            typeof user.avatar
          );
          userDetails.avatar = null;
          return res.status(200).json({ details: userDetails });
        }

        if (avatarBuffer && avatarBuffer.length > 0) {
          const type = imageType(avatarBuffer)?.mime || "image/jpeg";
          userDetails.avatar = `data:${type};base64,${avatarBuffer.toString(
            "base64"
          )}`;
        } else {
          userDetails.avatar = null;
        }
      } catch (err) {
        console.error("Error processing avatar:", err);
        userDetails.avatar = null;
      }
    }

    return res.status(200).json({ details: userDetails });
  } catch (err) {
    console.error("Error in userDetails:", err);
    return res.status(500).json({
      error: "Failed to retrieve user details",
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
        email: true,
      },
    });

    const usersWithAvatars = users.map((user) => {
      if (user.avatar) {
        try {
          let avatarBuffer;

          if (Buffer.isBuffer(user.avatar)) {
            avatarBuffer = user.avatar;
          } else if (typeof user.avatar === "string") {
            if (user.avatar.startsWith("data:")) {
              return { ...user };
            } else if (user.avatar.startsWith("http")) {
              return { ...user };
            } else {
              avatarBuffer = Buffer.from(user.avatar, "base64");
            }
          } else {
            console.error(
              "Unexpected avatar type for user",
              user.id,
              typeof user.avatar
            );
            return { ...user, avatar: null };
          }

          if (avatarBuffer && avatarBuffer.length > 0) {
            const type = imageType(avatarBuffer)?.mime || "image/jpeg";
            return {
              ...user,
              avatar: `data:${type};base64,${avatarBuffer.toString("base64")}`,
            };
          } else {
            return { ...user, avatar: null };
          }
        } catch (err) {
          console.error("Error processing avatar for user", user.id, err);
          return { ...user, avatar: null };
        }
      }
      return user;
    });

    return res.status(200).json({ data: usersWithAvatars });
  } catch (err) {
    console.error("Error in getUsers:", err);
    return res.status(500).json({
      error: "Failed to retrieve users",
    });
  }
};

export const uploadProfile = async (req, res) => {
  try {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ error: "No image file found in the request" });
    }

    const fileType = await fileTypeFromBuffer(req.file.buffer);
    if (!fileType || !fileType.mime.startsWith("image/")) {
      return res
        .status(400)
        .json({ error: "Invalid file type. Only images are allowed." });
    }

    if (req.file.buffer.length > 5 * 1024 * 1024) {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }

    const result = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: req.file.buffer },
      select: { id: true, email: true },
    });

    return res.status(200).json({
      message: "Image uploaded successfully",
      userId: result.id,
    });
  } catch (err) {
    console.error("Error in uploadProfile:", err);
    return res.status(500).json({
      error: "Failed to upload profile image",
    });
  }
};

export const userDelete = async (req, res) => {
  try {
    const id = parseInt(req.body.id, 10);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Error in userDelete:", err);
    return res.status(500).json({
      error: "Failed to delete user",
    });
  }
};

export const userUpdate = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const result = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash: password },
      select: { id: true, email: true },
    });

    return res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Error in userUpdate:", err);
    return res.status(500).json({
      error: "Failed to update user",
    });
  }
};
