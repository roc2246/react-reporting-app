const controllers = require("../../controllers/index");
const models = require("../models/index");
const utilities = require("../utilities/index");

const cron = require("node-cron");

module.exports = async () => {
  // FUNCTIONS
  function updateProductionDay(orders, shipmentIds, productionDay) {
    const shipmentOrderIdsSet = new Set(
      shipmentIds.map((shipment) => shipment.orderId)
    );

    orders.forEach((order) => {
      if (shipmentOrderIdsSet.has(order.orderId)) {
        models.setProductionDay(order.orderId, productionDay);
        console.log(
          `Shipment orderId: ${order.orderId} Date: ${productionDay}`
        );
      }
    });
  }

  // RUNS CHRON JOBS

  // Archieve orders
  cron.schedule("*/30 * * * *", async () => {
    await controllers.manageArchives();
  });

  // Archieve totals
  cron.schedule("0 23 * * *", async () => {
    const localRoute = "http://localhost:3000/data-from-day";
    const devRoute =
      "https://reporting-app-3194629a4aed.herokuapp.com/data-from-day";
    fetch(devRoute)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(async (data) => {
        await controllers.manageDailyTotals(data);
        console.log(data);
      })
      .catch(async (error) => {
        console.error("Error:", error);
        await require("../email/index")("Error", error.toString());
      });
  });

  // Assigns production day to orders
  cron.schedule("*/5 * * * *", async () => {
    console.log("Order processing is running");
    try {
      // Fetch orders
      const orders = await models.unprocessedOrderIds();
      const shipIds = {
        today: await models.shipIdsByDate(utilities.getProductionDay().today),
        tomorrow: await models.shipIdsByDate(
          utilities.getProductionDay().tomorrow
        ),
      };

      updateProductionDay(
        orders,
        shipIds.today,
        utilities.getProductionDay().today
      );
      updateProductionDay(
        orders,
        shipIds.tomorrow,
        utilities.getProductionDay().tomorrow
      );
    } catch (e) {
      console.error(`Error: ${e}`);
      await require("../email/index")("Error", e.toString());
    }
    console.log("Order processing has finished");
  });

  // Deletes mongo db records older than 60 days, but not summaries
  cron.schedule("0 20 * * *", async () => {
    try {
      await models.deleteData("orders");
      await models.deleteData("shipments-notified");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });

  // Adds data to order-que
  // Chron for 5am
  cron.schedule("0 5 * * *", async () => {
    try {
      await models.addQueTotal("fiveAM");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });
  // Chron for 3pm
  cron.schedule("0 15 * * *", async () => {
    try {
      await models.addQueTotal("threePM");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });
  // Chron for 6pm
  cron.schedule("0 18 * * *", async () => {
    try {
      await models.addQueTotal("sixPM");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });
  // Chron for 9pm
  cron.schedule("0 21 * * *", async () => {
    try {
      await models.addQueTotal("ninePM");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });
  // Chron for 11pm
  cron.schedule("0 23 * * *", async () => {
    try {
      await models.addQueTotal("elevenPM");
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });

  // Sends morning count at 5am
  cron.schedule("0 5 * * *", async () => {
    try {
      const productionDay = utilities.getProductionDay().today;
      const morningCount = await utilities.morningCounts();
      const email = "morningcounts@customcatch.simplelists.com";

      await require("../email/index")(
        `Counts for ${productionDay}`,
        morningCount,
        email
      );
    } catch (error) {
      console.error(`Error: ${error}`);
      await require("../email/index")("Error", error.toString());
    }
  });
};
