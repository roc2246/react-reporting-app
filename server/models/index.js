import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { getProductionDay, itemsPerHour, dateToDays } from "../utilities/index.js";

// Load environment variables
dotenv.config({
  path: path.join(process.cwd(), "config/.env"),
});

let client;

/** Connect to MongoDB */
export async function connectToDB() {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }
    const db = client.db("cc-orders");
    return { db, client };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

/** Insert new orders */
export async function newArchive(orders) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");
    const result = await collection.insertMany(orders);
    console.log(`${result.insertedCount} orders inserted successfully.`);
  } catch (error) {
    console.error("Error inserting orders:", error);
  }
}

/** Insert new notifications */
export async function newNotification(notifications) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("shipments-notified");
    const result = await collection.insertMany(notifications);
    console.log(`${result.insertedCount} notifications inserted successfully.`);
  } catch (error) {
    console.error("Error inserting notifications:", error);
  }
}

/** Delete old documents */
export async function deleteData(collectionName) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection(collectionName);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const formattedDate = sixtyDaysAgo.toISOString().split("T")[0];

    const result = await collection.deleteMany({ productionDay: { $lt: formattedDate } });
    console.log("Deleted documents count:", result.deletedCount);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Get all documents from a collection */
export async function getMongoData(collectionName) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection(collectionName);
    return await collection.find({}).toArray();
  } catch (err) {
    console.error(err);
  }
}

/** Query orders by productionDay */
export async function queryOrdersByDate(date) {
  return new Promise(async (resolve, reject) => {
    try {
      const { db } = await connectToDB();
      const collection = db.collection("orders");
      const query = { productionDay: date };
      const projection = { items: 1, customerNotes: 1 };
      const stream = collection.find(query).project(projection).stream();

      const result = [];
      stream.on("data", doc => result.push(doc));
      stream.on("end", () => resolve(result));
      stream.on("error", err => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

/** Orders missing productionDay */
export async function unprocessedOrderIds() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");
    return await collection.find({ productionDay: { $exists: false } })
                           .project({ _id: 0, orderId: 1 })
                           .toArray();
  } catch (err) {
    console.error(err);
  }
}

/** Get shipped IDs by date */
export async function shipIdsByDate(date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("shipments-notified");
    return await collection.find({ productionDay: date })
                           .project({ _id: 0, orderId: 1 })
                           .toArray();
  } catch (err) {
    console.error(err);
  }
}

/** Get totals of a day */
export async function pullTotalDataOfDay(productionDay) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const dailyTotals = await collection.findOne({ productionDay });
    return dailyTotals ?? { Error: "Totals have not been archived yet" };
  } catch (err) {
    console.error(err);
  }
}

/** Get distinct productionDays */
export async function pullProductionDays() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const days = await collection.distinct("productionDay");
    return days.length > 0 ? days : { Error: "No documents available" };
  } catch (err) {
    console.error(err);
  }
}

/** Get order queue productionDays */
export async function pullQueDays() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("order-que");
    const days = await collection.distinct("productionDay");
    return days.length > 0 ? days : { Error: "No documents available" };
  } catch (err) {
    console.error(err);
  }
}

/** Callback with all orders */
export async function useStoredOrders(callback) {
  try {
    const orders = await getMongoData("orders");
    callback(orders);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Store daily totals */
export async function storeTotals(totals, date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const exists = await collection.findOne({ productionDay: date });

    if (!exists) {
      await collection.insertOne(totals);
    } else {
      await collection.updateOne({ productionDay: date }, { $set: totals });
    }
  } catch (err) {
    console.error(err);
  }
}

/** Add totalHours to daily totals */
export async function addTotalHours(totalHours, date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const result = await collection.updateOne({ productionDay: date }, { $set: { totalHours } });
    console.log(`${result.modifiedCount} document(s) updated`);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Get total hours of today */
export async function getTotalHours() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const totals = await collection.findOne({ productionDay: getProductionDay().today });
    return totals?.totalHours ?? 0;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Add FBA totals */
export async function addFBA(FBA, date) {
  FBA = parseInt(FBA, 10);
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const exists = await collection.findOne({ productionDay: date });
    if (exists) {
      const totalItems =
        exists.items + exists.hats + exists.bibs + exists.miniBears +
        exists.giftBaskets + exists.towels + exists.potHolders + exists.bandanas + FBA;

      await collection.updateOne({ productionDay: date }, { $set: { FBA, totalItems } });
    } else {
      console.log("Error: Totals haven't been calculated yet");
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Get today's FBA number */
export async function getFBANo() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");
    const totals = await collection.findOne({ productionDay: getProductionDay().today });
    return totals?.FBA ?? 0;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Find user credentials */
export async function findUser(username) {
  try {
    const { db } = await connectToDB();
    return await db.collection("users").findOne({ username });
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Set productionDay for an order */
export async function setProductionDay(orderId, date) {
  try {
    const { db } = await connectToDB();
    await db.collection("orders").updateOne({ orderId }, { $set: { productionDay: date } });
  } catch (err) {
    console.error(err);
  }
}

/** Historical totals range */
export async function getHistoricalRange(startDate, endDate) {
  try {
    const { db } = await connectToDB();
    const result = await db.collection("daily-totals")
                           .find({ productionDay: { $gte: startDate, $lte: endDate } })
                           .sort({ productionDay: 1 })
                           .toArray();

    return result.map(doc => {
      const totalHours = Number((Math.round(doc.totalHours * 10) / 10).toFixed(1));
      const iph = itemsPerHour(doc.totalItems, totalHours);
      return { ...doc, itemsPerHour: iph === "Infinity" ? "N/A" : iph };
    });
  } catch (err) {
    console.error(err);
  }
}

/** Get order IDs by date range */
export async function getOrderIDs(startDate, endDate) {
  try {
    const { db } = await connectToDB();
    return await db.collection("orders").distinct("orderId", {
      productionDay: { $gte: startDate, $lte: endDate },
    });
  } catch (err) {
    console.error(err);
  }
}

/** Get all order IDs */
export async function getAllOrderIDs() {
  try {
    const { db } = await connectToDB();
    return await db.collection("orders").find({}).project({ orderId: 1 }).toArray();
  } catch (err) {
    console.error(err);
  }
}

/** Update total hours in daily-totals */
export async function updateExcelTotalHours(productionDay, hours) {
  try {
    const { db } = await connectToDB();
    const result = await db.collection("daily-totals")
                           .updateOne({ productionDay }, { $set: { totalHours: hours } });
    return result.modifiedCount === 1;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Order volumes report */
export async function orderVolumesReport(dates) {
  try {
    const { db } = await connectToDB();
    const que = db.collection("order-que");
    const dailyTotals = db.collection("daily-totals");

    const result = [];
    for (const date of dates) {
      const [queData, productionHours] = await Promise.all([
        que.findOne({ productionDay: date }),
        dailyTotals.aggregate([
          { $match: { productionDay: date } },
          { $project: { _id: 0, totalHours: { $round: ["$totalHours", 1] } } }
        ]).toArray()
      ]);
      result.push({
        productionDay: date,
        fiveAM: queData?.fiveAM ?? 0,
        threePM: queData?.threePM ?? 0,
        sixPM: queData?.sixPM ?? 0,
        ninePM: queData?.ninePM ?? 0,
        elevenPM: queData?.elevenPM ?? 0,
        productionHours: productionHours[0]?.totalHours ?? 0,
      });
    }
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/** Add que totals */
export async function addQueTotal(time) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("order-que");
    const todaysDate = getProductionDay().today;

    const que = await collection.find({ productionDay: todaysDate }).toArray();
    if (!que.length) {
      await collection.insertOne({ productionDay: todaysDate, fiveAM:0, threePM:0, sixPM:0, ninePM:0, elevenPM:0 });
    }

    const url = `https://reporting-app-3194629a4aed.herokuapp.com/awaiting-shipment?page=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const { total } = await response.json();
    await collection.updateOne({ productionDay: todaysDate }, { $set: { [time]: total } });
  } catch (err) {
    console.error(err);
    throw err;
  }
}
