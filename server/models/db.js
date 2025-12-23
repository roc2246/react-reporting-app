import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), "config/.env") });

let client;

/** Connect to MongoDB */
export async function connectToDB() {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }
    return { db: client.db("cc-orders"), client };
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    throw err;
  }
}
