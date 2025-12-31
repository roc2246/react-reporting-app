import { connectToDB } from "./db.js";
import { getProductionDay } from "../utilities/index.js";

// Get order queue productionDays
export async function pullQueDays() {
  const { db } = await connectToDB();
  const days = await db.collection("order-que").distinct("productionDay");
  return days.length > 0 ? days : { Error: "No documents available" };
}

// Add que totals
export async function addQueTotal(time) {
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
}

export async function orderVolumesReport(dates) {
  try {
    const { db } = await connectToDB();
    const que = db.collection("order-que");
    const dailyTotals = db.collection("daily-totals");

    // Aggregate data for each date
    const result = [];
    for (const date of dates) {
      const [queData, productionHours] = await Promise.all([
        que.findOne({ productionDay: date }),
        dailyTotals
          .aggregate([
            {
              $match: { productionDay: date },
            },
            {
              $project: {
                _id: 0,
                totalHours: { $round: ["$totalHours", 1] },
              },
            },
          ])
          .toArray(),
      ]);

      const totalHours =
        productionHours.length > 0 ? productionHours[0].totalHours : 0;

      const data = {
        productionDay: date,
        fiveAM: queData ? queData.fiveAM : 0,
        threePM: queData ? queData.threePM : 0,
        sixPM: queData ? queData.sixPM : 0,
        ninePM: queData ? queData.ninePM : 0,
        elevenPM: queData ? queData.elevenPM : 0,
        productionHours: totalHours,
      };

      result.push(data);
    }

    return result;
  } catch (error) {
    console.error("Error fetching historical range report:", error);
    throw error;
  }
}
