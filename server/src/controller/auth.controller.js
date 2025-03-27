import jwt from "jsonwebtoken";
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


