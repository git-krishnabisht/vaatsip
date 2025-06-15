import { fileTypeFromBuffer } from "file-type";
import imageType from "image-type";
import db from "../libs/db.js";

export const getPictures = async (req, res) => {
  const { username } = req.params;
  try {
    if (!username) {
      return res.status(400).json({ message: "Username not found" });
    }
    const result = await db.query(
      "SELECT image FROM users where username = $1;",
      [username]
    );
    if (result.rows[0].image === null) {
      return res.status(400);
    }
    const img = result.rows[0].image;
    if (!img) {
      return res
        .status(404)
        .json({ message: "No image found from the result query" });
    }
    const fileType = await fileTypeFromBuffer(img);
    res.setHeader("Content-Type", fileType.mime);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${username}-img.${fileType.ext}"`
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
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ message: "User not found" });
    }
    const details = await db.query("select * from users where username = $1;", [username]);
    const _details = details.rows[0];
    if (!_details.image) return res.status(200).json({ details: _details });
    const type = imageType(_details.image)?.mime || "image/jpeg";
    const base64Image = `data:${type};base64,${_details.image.toString("base64")}`;
    const userdetails = { ..._details, image: base64Image };
    return res.status(200).json({ details: userdetails });
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the /user-details : " + err.stack || err });
  }
};

export const getUsers = async (_, res) => {
  try {
    const { rows } = await db.query("SELECT username,image FROM users");
    const usersWithBase64 = rows.map((user) => {
      if (!user.image) return { username: user.username, image: null };
      const type = imageType(user.image)?.mime || "image/jpeg";
      const base64Image = `data:${type};base64,${user.image.toString("base64")}`;
      return { username: user.username, image: base64Image };
    });
    res.json(usersWithBase64);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /get-users :\n " + err.stack,
    });
  }
};

export const uploadProfile = async (req, res) => {
  try {
    const username = req.username;
    const checkUser = await db.query(
      "SELECT EXISTS (SELECT 1 FROM users WHERE username = $1);",
      [username]
    );

    if (!checkUser.rows[0].exists) {
      return res.status(404).json({ error: "User does not exist" });
    }

    if (!req.file?.buffer) {
      return res.status(400).json({ error: "No image file found in the request" });
    }

    const image = req.file.buffer;
    const result = await db.query(
      "UPDATE users SET image = $1 WHERE username = $2 RETURNING username;",
      [image, username]
    );

    if (result.rowCount > 0) {
      return res.status(200).json({
        message: "Image uploaded successfully",
        username: result.rows[0].username,
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
    const username = req.username;
    return res.status(201).json(username);
  } catch (err) {
    return res.status(400).send({ error: "Failed to get the user" });
  }
};

export const userDelete = async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username not found" });
  }
  try {
    const result = await db.query(`delete from users where username=$1;`, [username]);
    if (result.rowCount > 0) {
      return res.status(200).send({ message: "User deleted sucessfully" });
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
  console.log("req", req);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send({ message: "Provide correct information" });
  }
  const updateQuery = `update users set password=$2 where username=$1 returning *;`;
  try {
    const result = await db.query(updateQuery, [username, password]);
    if (result.rowCount > 0) {
      return res.status(200).send({ message: "Updation successfull" });
    } else {
      return res.status(400).send({ message: "Updation failed" });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /user-update :\n " + err.stack,
    });
  }
};
