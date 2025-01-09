import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import dotenv from "dotenv";
import db from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import { receiverSocketId, io} from "./lib/socket.js"

dotenv.config();
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage });


const privateKey = process.env.PRIVATE_KEY;
const publicKey = process.env.PUBLIC_KEY;

app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/get-messages/:user", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Authorization header is missing or invalid" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(400).json({ message: "Token is not available in the authorization header" });
    }
    const sender = jwt.verify(token, publicKey, { algorithm: "RS256" }).username

    const receiver = req.params.user;
    const query = await db.query("select c.message, a.image_data, c.sender, c.receiver, c.created_at from conversation c left join attachments a on c.message_id = a .message_id where (c.sender = $1 and c.receiver = $2) or (c.sender = $2 and c.receiver = $1) order by c.created_at;", [sender, receiver]);
    if (query.rows <= 0) {
      return res.status(400).json({ message: "No messages in the conversation yet" });
    }
    return res.status(200).json([query.rows, sender]);
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the get-messages \n " + err.stack || err });
  }
});

app.post("/send-message/:receiver", upload.single("image_data"), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header is missing or invalid" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(400).json({ message: "Token is not available in the authorization header" });
  }
  try {
    const sender = jwt.verify(token, publicKey, { algorithm: "RS256" }).username;
    const receiver = req.params.receiver;
    const message = req.body.message;

    const file = req.file;
    if (!message && !file) {
      return res.status(400).json({ message: "Either message or an image must be provided" });
    }
    const conversationQuery = await db.query("INSERT INTO conversation(sender, receiver, message) VALUES ($1, $2, $3) RETURNING message_id", [sender, receiver, message || null]);

    const messageId = conversationQuery.rows[0]?.message_id;
    let image = null;
    let imagetype = null;
    if (file) {
      image = file.buffer;
      imagetype = file.mimetype;
      const attachmentQuery = await db.query("insert into attachments(message_id, image_data, image_type) values ($1, $2 ,$3);", [messageId, image, imagetype]);
      if (attachmentQuery.rowCount === 0) {
        return res.status(400).json({ message: "Failed to save attachment" });
      }
    }

    const socketId = receiverSocketId(receiver);
    if (socketId) {
      io.to(socketId).emit("newMessage", { message, image , imagetype });
      console.log("Message sent successfully from the socket's server");
    }

    return res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Something is wrong with the send-messages \n " + err });
  }
});

app.post("/upload-profile", upload.single("image"), async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization header is missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const username = jwt.verify(token, publicKey, { algorithm: "RS256" }).username

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
});


app.post("/sign-in", async (req, res) => {
  const signOptions = {
    expiresIn: "7d",
    algorithm: "RS256",
  };

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Fill out the credentials" });
  }
  const searchQuery = `select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;`;

  try {
    const result = await db.query(searchQuery, [username, password]);
    var token = jwt.sign({ username }, privateKey, signOptions);

    if (result.rows[0].is_valid) {
      return res
        .status(200)
        .send({ token: token, message: "Sign in Successfull" });
    } else {
      return res.status(400).send({ error: "Sign in Failed" });
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Something is wrong with the /sign-in :\n " + err.stack || err });
  }
});

app.get("/get-users", async (_, res) => {
  try {
    const { rows } = await db.query("SELECT username,image FROM users");
    return res.status(200).json(rows);
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /get-users :\n " + err.stack,
    });
  }
});

app.post("/sign-up", async (req, res) => {
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
});

app.get("/get-pictures/:username", async (req, res) => {
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
});



app.post("/user-login", async (req, res) => {
  const payload = {
    username: req.body.username,
  };

  const signOptions = {
    expiresIn: "7d",
    algorithm: "RS256",
  };

  const { username, password } = req.body;
  const searchQuery = `select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;`;

  try {
    const result = await db.query(searchQuery, [username, password]);
    var token = jwt.sign(payload, privateKey, signOptions);

    if (result.rows[0].is_valid) {
      return res
        .status(200)
        .send({ token: token, message: "Login Successfull" });
    } else {
      return res.status(400).send({ error: "Login Failed" });
    }
  } catch (err) {
    return res.status(500).json({
      error: "Something is wrong with the /user-login :\n " + err.stack,
    });
  }
});

app.get("/get-user", async (req, res) => {

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(400)
      .json({ message: "Token is not available in the authorization header" });
  }
  try {
    const username = jwt.verify(token, publicKey, {
      expiresIn: "7d",
      algorithm: "RS256",
    }).username;
    return res.status(201).json(username);
  } catch (err) {
    return res.status(400).send({ error: "Failed to get the user" });
  }
});

app.delete("/user-delete", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: "Username not found" });
  }
  const deleteQuery = `delete from users where username=$1;`;
  try {
    const result = await db.query(deleteQuery, [username]);
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
});

app.put("/user-update", async (req, res) => {
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
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});
