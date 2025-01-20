import jwt from "jsonwebtoken";
import { fileTypeFromBuffer } from "file-type";
import db from "../lib/db.js";

export const signIn = async (req, res) => {
  const signOptions = {
    expiresIn: "7d",
    algorithm: "RS256",
  };
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Fill out the credentials" });
  }
  const searchQuery = `select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;`;

  try {
    const result = await db.query(searchQuery, [username, password]);
    var token = jwt.sign({ username }, process.env.PRIVATE_KEY, signOptions);

    if (result.rows[0].is_valid) {
      return res
        .status(200)
        .send({ token: token, message: "Sign in Successfull" });
    } else {
      return res.status(400).send({ message: "Sign in Failed" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Something is wrong with the /sign-in :\n " + err.stack || err });
  }
};

export const signUp = async (req, res) => {
  try {
    const { username, name, email, gender, dob, password } = req.body;
    if (!username || !name || !email || !gender || !dob || !password) {
      return res.status(400).json({
        error: "Fill out the credentials"
      });
    }
    const result = await db.query(
      "select exists (select 1 FROM users WHERE username = $1)",
      [username]
    );
    if (result.rows[0].exists) {
      return res.status(400).send({ message: "User already exists" });
    } else {
      const query = {
        text: "insert into users (username, name, email, gender, dob, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        values: [username, name, email, gender, dob, password],
      };

      const inc = await db.query(query);
      if (inc.rowCount) {
        return res.status(200).json({
          message: "Registered successfully",
        });
      } else {
        return res.status(400).json({
          error: "Registration failed",
        });
      }
    }
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /create-account :\n " + err.stack,
    });
  }
};

export const uploadProfile =  async (req, res) => {
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

export const getUsers = async (_, res) => {
  try {
    const { rows } = await db.query("SELECT username,image FROM users");
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /get-users :\n " + err.stack,
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
    console.log("res", result);
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
