import { connectToDB } from "./db.js";

// Find user credentials
export async function findUser(username) {
  try {
    const { db } = await connectToDB();
    return await db.collection("users").findOne({ username });
  } catch (err) {
    console.error(err);
    throw err;
  }
}