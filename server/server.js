/*
* 1 - Include the image uploading functionality both in server in client
* 2 - Also include JWT Tokens functioality either store then in the localstorage or cookie, the reason 
*     being because you have to priorly know, what is the name of the user in which you are going to 
*     upload the picture.
*/

import express from "express";
import pg from "pg";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import fs from "fs";

const { Client } = pg;
const db = new Client(
  "postgres://postgres:501363495577409@localhost:5432/my_database",
);

const storage = multer.memoryStorage();
const upload = multer({storage});
const privatekey = fs.readFileSync("./private.key", "utf8");

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
  }),
);

app.use(express.json());

app.get("/get-users", async (_, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM users");
    return res.status(200).json({ users: rows });
  } catch (err) {
    console.error("errorfetching users:", err.stack);
    return res.status(500).json({ error: "Error while fetching data" });
  }
});

app.post("/edit-profile", upload.single("image"), async (req, res) => {
  try {
    if(!req.file) {
      return res.status(400).send("Error with request");
    }
    const base64Image = req.file.buffer.toString("base64");


  } catch(err) {
  }
});

app.post("/create-account", async (req, res) => {
  try {
    const { username, name, email, gender, dob, password } = req.body;
    const result = await db.query(
      "select exists (select 1 FROM users WHERE username = $1)",
      [username],
    );
    if (result.rows[0].exists) {
      console.log("User already exists");
      return res.status(400).send("User already exists");
    } else {
      const query = {
        text: "insert into users (username, name, email, gender, dob, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        values: [username, name, email, gender, dob, password],
      };

      await db.query(query);
      console.log("User Registered successfully:");
      return res.status(200).send({
        message: "Registered successfully",
      });
    }
  } catch (err) {
    console.error("error registering user:", err.stack);
    return res.status(500).send(err);
  }
});

app.post("/user-login", async (req, res) => {

  const payload = {
    username: req.username
  };

  const signOptions = {
    expiresIn: "1h",
    algorithm: "RS256"
  };

  const { username, password } = req.body;
  const searchQuery = `select case when count(*) > 0 then TRUE else FALSE end as is_valid from users where username=$1 and password=$2;`;

  try {
    const result = await db.query(searchQuery, [username, password]);
    var token = jwt.sign(payload, privatekey, signOptions);

    if (result.rows[0].is_valid) {
      console.log("Login successfull");
      res.send({ token }).status(200);
    } else {
      res.status(400);
      console.log("Login failed");
    }
  } catch (err) {
    console.error("Error : ", err.stack);
  }
});

app.delete("/user-delete", async (req, res) => {
  const { username } = req.body;
  const deleteQuery = `delete from users where username=$1;`;
  try {
    const result = await db.query(deleteQuery, [username]);
    if (result.rowCount > 0) {
      console.log("Deletion successful");
      res.status(200);
    } else {
      console.log("Count not find the user");
      res.status(400);
    }
  } catch (err) {
    console.error("Error at delete : ", err.stack);
  }
});

app.put("/user-update", async (req, res) => {
  const { username, password } = req.body;
  const updateQuery = `update users set password=$2 where username=$1 returning *;`;
  try {
    const result = await db.query(updateQuery, [username, password]);
    if (result.rowCount > 0) {
      console.log(`the ${result.rows[0].username} updated Successfully`);
      res.status(200);
    } else {
      console.error("Cannot Update : ");
      res.status(400);
    }
  } catch (err) {
    console.error("Error : ", err.stack);
  }
});

app.listen(50136, () => {
  console.log("Server is Listening to port 50136...");
});

/*
 * To-do -> have to create upload profile page from where you can upload you profile picture and if there is not profile picture then it will use the default picture from teh storage
 */
