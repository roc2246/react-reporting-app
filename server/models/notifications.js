import { connectToDB } from "./db.js";

// Insert new notifications
export async function newNotification(notifications) {
  const { db } = await connectToDB();
  const result = await db.collection("shipments-notified").insertMany(notifications);
  console.log(`${result.insertedCount} notifications inserted successfully.`);
}

// Get shipped IDs by date
export async function shipIdsByDate(date) {
  const { db } = await connectToDB();
  return await db.collection("shipments-notified")
                 .find({ productionDay: date })
                 .project({ _id: 0, orderId: 1 })
                 .toArray();
}
