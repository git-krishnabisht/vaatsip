import pg from "pg";
import dotenv from "dotenv";
dotenv.config();
const { Client } = pg;

const db = new Client({ connectionString: process.env.DB_URI });

(async () => {
  try {
    await db.connect();
    console.log("Connected to the DB");
  } catch (err) {
    console.error("Failed to connect to the database: ", err.stack);
    process.exit(1);
  }
})();

export default db;
