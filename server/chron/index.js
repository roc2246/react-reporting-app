// /server/chron/index.js

import * as controllers from "../controllers/index.js";
import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";
import cron from "node-cron";

export async function initCron() {
  // Archive orders
  cron.schedule("*/30 * * * *", async () => await controllers.manageArchives());

  // Archive totals
  cron.schedule("0 23 * * *", async () => {
    try {
      const data = utilities.fetchData("/api/data-from-day");
      await controllers.manageDailyTotals(data);
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
      const { default: sendEmail } = await import("../email/index.js");
      await sendEmail("Error", error.toString());
    }
  });

  // Assigns production day to orders
  cron.schedule("*/5 * * * *", async () => {
    console.log("Order processing is running");
    try {
      const orders = await models.unprocessedOrderIds();

      const todaysDate = utilities.productionDay().today;
      const tomorrowDate = utilities.productionDay().tomorrow;

      const shipIds = {
        today: await models.shipIdsByDate(todaysDate),
        tomorrow: await models.shipIdsByDate(tomorrowDate),
      };

      controllers.updateProductionDay(orders, shipIds.today, todaysDate);
      controllers.updateProductionDay(orders, shipIds.tomorrow, tomorrowDate);
      
    } catch (e) {
      console.error(`Error: ${e}`);
      const { default: sendEmail } = await import("../email/index.js");
      await sendEmail("Error", e.toString());
    }
    console.log("Order processing has finished");
  });

  // Deletes MongoDB records older than 60 days, but not summaries
  cron.schedule("0 20 * * *", async () => {
    try {
      await models.deleteData("orders");
      await models.deleteData("shipments-notified");
    } catch (error) {
      console.error(`Error: ${error}`);
      const { default: sendEmail } = await import("../email/index.js");
      await sendEmail("Error", error.toString());
    }
  });

  // Adds data to order queue
  const queSchedules = [
    { time: "0 5 * * *", label: "fiveAM" },
    { time: "0 15 * * *", label: "threePM" },
    { time: "0 18 * * *", label: "sixPM" },
    { time: "0 21 * * *", label: "ninePM" },
    { time: "0 23 * * *", label: "elevenPM" },
  ];

  for (const schedule of queSchedules) {
    cron.schedule(schedule.time, async () => {
      try {
        await models.addQueTotal(schedule.label);
      } catch (error) {
        console.error(`Error: ${error}`);
        const { default: sendEmail } = await import("../email/index.js");
        await sendEmail("Error", error.toString());
      }
    });
  }

  // Sends morning count at 5am
  cron.schedule("0 5 * * *", async () => {
    try {
      const productionDay = utilities.productionDay().today;
      const morningCount = await utilities.morningCounts();
      const email = "morningcounts@customcatch.simplelists.com";

      const { default: sendEmail } = await import("../email/index.js");
      await sendEmail(`Counts for ${productionDay}`, morningCount, email);
    } catch (error) {
      console.error(`Error: ${error}`);
      const { default: sendEmail } = await import("../email/index.js");
      await sendEmail("Error", error.toString());
    }
  });
}
