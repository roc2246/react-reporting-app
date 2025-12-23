import { connectToDB } from "./db.js";
import { getProductionDay, itemsPerHour } from "../utilities/index.js";

// Insert new orders
export async function newArchive(orders) {
  try {
    const { db } = await connectToDB();
    const result = await db.collection("orders").insertMany(orders);
    console.log(`${result.insertedCount} orders inserted successfully.`);
  } catch (err) {
    console.error(err);
  }
}

// Query orders by productionDay
export async function queryOrdersByDate(date) {
  const { db } = await connectToDB();
  const collection = db.collection("orders");
  const query = { productionDay: date };
  const projection = { items: 1, customerNotes: 1 };
  const stream = collection.find(query).project(projection).stream();

  return new Promise((resolve, reject) => {
    const result = [];
    stream.on("data", doc => result.push(doc));
    stream.on("end", () => resolve(result));
    stream.on("error", err => reject(err));
  });
}

// Orders missing productionDay
export async function unprocessedOrderIds() {
  const { db } = await connectToDB();
  return await db.collection("orders")
                 .find({ productionDay: { $exists: false } })
                 .project({ _id: 0, orderId: 1 })
                 .toArray();
}

// Set productionDay for an order
export async function setProductionDay(orderId, date) {
  const { db } = await connectToDB();
  await db.collection("orders").updateOne({ orderId }, { $set: { productionDay: date } });
}

// Get all order IDs
export async function getAllOrderIDs() {
  const { db } = await connectToDB();
  return await db.collection("orders").find({}).project({ orderId: 1 }).toArray();
}

// Get order IDs by date range
export async function getOrderIDs(startDate, endDate) {
  const { db } = await connectToDB();
  return await db.collection("orders").distinct("orderId", {
    productionDay: { $gte: startDate, $lte: endDate },
  });
}
