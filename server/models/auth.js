import { connectToDB } from "./db.js";

// Find user credentials
export async function findUser(username) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("users");

    return await collection.findOne({ username });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
