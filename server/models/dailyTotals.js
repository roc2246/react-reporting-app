import { connectToDB } from "./db.js";
import { productionDay, itemsPerHour } from "../utilities/index.js";

// Pull totals of a day
export async function pullTotalDataOfDay(productionDay) {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  const totals = await collection.findOne({ productionDay });
  return totals ?? { Error: "Totals have not been archived yet" };
}

// Store daily totals
export async function storeTotals(totals, date) {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  const exists = await collection.findOne({ productionDay: date });

  if (!exists) {
    await collection.insertOne(totals);
  } else {
    await collection.updateOne({ productionDay: date }, { $set: totals });
  }
}

// Add totalHours to daily totals
export async function addTotalHours(totalHours, date) {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  await collection.updateOne({ productionDay: date }, { $set: { totalHours } });
}

// Get total hours of today
export async function getTotalHours() {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  const totals = await collection.findOne({
    productionDay: productionDay().today,
  });
  return totals?.totalHours ?? 0;
}

// Add FBA totals
export async function addFBA(FBA, date) {
  FBA = parseInt(FBA, 10);
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");
  const exists = await collection.findOne({ productionDay: date });
  if (exists) {
    const totalItems =
      exists.items +
      exists.hats +
      exists.bibs +
      exists.miniBears +
      exists.giftBaskets +
      exists.towels +
      exists.potHolders +
      exists.bandanas +
      FBA;

    await collection.updateOne(
      { productionDay: date },
      { $set: { FBA, totalItems } },
    );
  }
}

// Get today's FBA number
export async function getFBANo() {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  const totals = await collection.findOne({
    productionDay: productionDay().today,
  });
  return totals?.FBA ?? 0;
}

// Historical totals range
export async function getHistoricalRange(startDate, endDate) {
  const { db } = await connectToDB();
  const collection = db.collection("daily-totals");

  const result = await collection
    .find({ productionDay: { $gte: startDate, $lte: endDate } })
    .sort({ productionDay: 1 })
    .toArray();
  return result.map((doc) => {
    const totalHours = Number(
      (Math.round(doc.totalHours * 10) / 10).toFixed(1),
    );
    const iph = itemsPerHour(doc.totalItems, totalHours);
    return { ...doc, itemsPerHour: iph === "Infinity" ? "N/A" : iph };
  });
}

export async function pullProductionDays() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const days = await collection.distinct("productionDay");

    const result = days.length > 0 ? days : { Error: "No results" };
    return result;
  } catch (err) {
    console.error("Error while processing pullProductionDays:", err);
    throw err; // propagate error to controllers
  }
}
