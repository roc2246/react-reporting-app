const path = require("path");
const controllers = require("../../controllers/index");
const models = require("../models/index");

require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

module.exports = async () => {
  const pageNo = 2;
  const date = "2024-02-10";
  const apiUrl = `https://reporting-app-3194629a4aed.herokuapp.com/recover-orders?page=${pageNo}&date=${date}`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text(); // Get the error response body as text
      throw new Error(
        `Network response was not ok: ${response.status} ${response.statusText}. Response body: ${errorText}`
      );
    }

    const { orders, pages } = await response.json();
    console.log(`${orders.length} Orders, ${pageNo}/${pages} pages`);

    // Imports all orders that havent been imported yet
    await controllers.manageShipstationOrders(orders);

    // Assign production day to recently added orders orders
    const unprocessedOrderIds = await models.unprocessedOrderIds();
    const shipmentIds = await models.shipIdsByDate(date);

    const shipmentOrderIdsSet = new Set(
      shipmentIds.map((shipment) => shipment.orderId)
    );

    // Filter unprocessed order IDs to include only those present in the shipment order IDs set
    const unprocessedOrderIdsInShipments = unprocessedOrderIds.filter((order) =>
      shipmentOrderIdsSet.has(order.orderId)
    );

    // Sets the production days
    Object.entries(unprocessedOrderIdsInShipments).forEach(
      async ([key, { orderId }]) => {
        await models.setProductionDay(orderId, date);
        console.log(`${orderId} marked with ${date} production day`)
      }
    );

    // Logs the number of production days that have just been marked
    console.log(
      `${unprocessedOrderIdsInShipments.length} orders marked with ${date} production day.`
    );

  } catch (error) {
    // Handle errors
    console.error("Error fetching data:", error);
  }
};
