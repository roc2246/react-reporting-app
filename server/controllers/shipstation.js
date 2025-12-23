import https from "https";
import * as models from "../models/index.js";

/**
 * Generic GET request to ShipStation API
 */
export async function fetchOrders(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: process.env.BASE_URL,
      path: url,
      method: "GET",
      auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error("Invalid JSON response from ShipStation"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.end();
  });
}

/**
 * Returns orders shipped in the last 12 hours
 */
export async function archiveOrders(req, res, page = 1, fetchFn = fetchOrders) {
  const now = new Date();
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const url = `/orders?orderStatus=shipped&modifyDateStart=${twelveHoursAgo.toISOString()}&modifyDateEnd=${now.toISOString()}&page=${page}&pageSize=500`;

  try {
    const orders = await fetchFn(url);
    res.json(orders);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Returns orders awaiting shipment
 */
export async function awaitingShipment(req, res, page = 1, fetchFn = fetchOrders) {
  const url = `/orders?orderStatus=awaiting_shipment&pageSize=500&page=${page}`;

  try {
    const orders = await fetchFn(url);
    res.json(orders);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Recovers shipped orders for a given date
 */
export async function recoverData(req, res, page = 1, date, fetchFn = fetchOrders) {
  const prevDate = new Date(new Date(date).setDate(new Date(date).getDate() - 1))
    .toISOString()
    .split("T")[0];
  const modifyStartDate = `${prevDate}T17:00:00.000Z`;
  const modifyEndDate = `${date}T16:59:59.999Z`;
  const url = `/orders?orderStatus=shipped&modifyDateStart=${modifyStartDate}&modifyDateEnd=${modifyEndDate}&page=${page}&pageSize=500`;

  try {
    const orders = await fetchFn(url);
    res.json(orders);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Process shipped orders and add new ones to the database
 */

export async function manageArchives(
  shipments = utilities.fetchShipped,
  filter = manageShipstationOrders
) {
  try {
    const { orders, total, pages } = await shipments(1);

    let allOrders = [...orders];

    if (pages > 1) {
      for (let x = 2; x <= pages; x++) {
        const { orders: additionalOrders } = await shipments(x);
        allOrders.push(...additionalOrders);
      }
    }

    await filter(allOrders);
  } catch (error) {
    console.error("Error:", error);
    // await require("../email/index")("Error", error.stack.toString());
  }
}

/**
 * Process awaiting shipment orders and save new ones
 */
export async function manageAwaiting(fetchFn = awaitingShipment, saveFn = models.saveOrders) {
  let page = 1;
  let allOrders = [];

  while (true) {
    const orders = await fetchFn(null, null, page);
    if (!orders || orders.length === 0) break;

    const newOrders = [];
    for (const order of orders) {
      const exists = await models.orderExists(order.orderNumber);
      if (!exists) newOrders.push(order);
    }

    if (newOrders.length > 0) await saveFn(newOrders);
    allOrders.push(...orders);
    page += 1;
  }

  return allOrders;
}

/**
 * Process recovered shipped orders by date and add new ones to the DB
 */
export async function manageRecovered(date, fetchFn = recoverData, saveFn = models.saveOrders) {
  let page = 1;
  let allOrders = [];

  while (true) {
    const orders = await fetchFn(null, null, page, date);
    if (!orders || orders.length === 0) break;

    const newOrders = [];
    for (const order of orders) {
      const exists = await models.orderExists(order.orderNumber);
      if (!exists) newOrders.push(order);
    }

    if (newOrders.length > 0) await saveFn(newOrders);
    allOrders.push(...orders);
    page += 1;
  }

  return allOrders;
}
