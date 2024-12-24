import express from "express";
import pg from "pg";
import cors from "cors";
import jwt from "jsonwebtoken";
import fs from "fs";
import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const { Client } = pg;
const db = new Client(
  "postgres://postgres:501363495577409@localhost:5432/my_database"
);
const upload = multer({ storage: multer.memoryStorage() });

const privatekey = fs.readFileSync("./server/private.key", "utf8");
const publickey = fs.readFileSync("./server/public.key", "utf8");

(async () => {
  try {
    await db.connect();
    console.log("Connected to the DB");
  } catch (err) {
    console.error("Error while connecting to the database", err.stack);
  }
})();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.get("/get-users", async (_, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM users");
    return res.status(200).json({ users: rows });
  } catch (err) {
    console.error("Error fetching users:", err.stack);
    return res.status(500).json({ error: "Error while fetching data" });
  }
});

app.post("/create-account", async (req, res) => {
  try {
    const { username, name, email, gender, dob, password } = req.body;
    const result = await db.query(
      "select exists (select 1 FROM users WHERE username = $1)",
      [username]
    );
    if (result.rows[0].exists) {
      return res.status(400).send({message: "User already exists"});
    } else {
      const query = {
        text: "insert into users (username, name, email, gender, dob, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        values: [username, name, email, gender, dob, password],
      };

      const inc = await db.query(query);
      if (inc.rowCount) {
        return res.status(201).json({
          message: "Registered successfully",
        });
      } else {
        return res.status(500).json({
          message: "Registration failed. Please try again later.",
        });
      }
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
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
    return res
      .status(400)
      .json({ message: "Error while fetching the picture : " + err });
  } });

app.post("/edit-profile", upload.single("image"), async (req, res) => {
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
    const auth = jwt.verify(token, publickey, {
      expiresIn: "1h",
      algorithm: "RS256",
    });

    const username = auth.username;
    const checkUser = await db.query(
      "Select exists (Select 1 FROM users Where username = $1);",
      [username]
    );

    if (!checkUser.rows[0].exists) {
      return res.status(400).json({ message: "User not exists" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No presence of the file in the request" });
    }

    const image = req.file.buffer;

    if (!image) {
      return res
        .status(400)
        .json({ message: "No presence of the image in the buffer" });
    }

    const result = await db.query(
      "Update users SET image = $1 WHERE username = $2 RETURNING *;",
      [image, username]
    );

    if (result.rowCount) {
      return res.status(200).send({ message: "Image uploaded successfully" });
    } else {
      return res
        .send({ message: "Error while uploading the image" });
    }
  } catch (err) {
    return res.status(400).send({ message: "Error while uploading the image" });
  }
});

app.post("/user-login", async (req, res) => {
  const payload = {
    username: req.body.username,
  };

  const signOptions = {
    expiresIn: "1h",
    algorithm: "RS256",
  };

  const { username, password } = req.body;
  const searchQuery = `select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;`;

  try {
    const result = await db.query(searchQuery, [username, password]);
    var token = jwt.sign(payload, privatekey, signOptions);

    if (result.rows[0].is_valid) {
      return res
        .status(200)
        .send({ token: token, message: "Login Successfull" });
    } else {
      return res.status(400).send({ error: "Login Failed" });
    }
  } catch (err) {
    console.error("Error : ", err.stack);
  }
});

app.get("/current-user", async (req, res) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization header is missing" });
  }
  const token = authHeader.split(" ")[1];

  if(!token) {
    return res
      .status(400)
      .json({ message: "Token is not available in the authorization header" });
  }

  try {
    const auth = jwt.verify(token, publickey, {
      expiresIn: "1h",
      algorithm: "RS256",
    });
    return res.json(auth.username);
  } catch (err) {
    return res.status(400).send({ message: "Cannot get the username"});
  }
})

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
    return res.status(400).send({ message: "Error while deletion" });
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
    return res.status(400).send({ message: "Error while updation" });
  }
});

const PORT = 50136;

app.listen(PORT, () => {
  console.log(`Server is Listening to port ${PORT}...`);
});
