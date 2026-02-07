import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";

/**
 * Returns orders awaiting shipment
 */
export async function awaitingShipment(req, res, page = 1) {
  const url = `/orders?orderStatus=awaiting_shipment&pageSize=500&page=${page}`;

  try {
    const orders = await utilities.fetchOrders(url);
    res.json(orders);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Recovers shipped orders for a given date
 */
export async function recoverData(req, res, page = 1, date) {
  const prevDate = new Date(
    new Date(date).setDate(new Date(date).getDate() - 1),
  )
    .toISOString()
    .split("T")[0];
  const modifyStartDate = `${prevDate}T17:00:00.000Z`;
  const modifyEndDate = `${date}T16:59:59.999Z`;
  const url = `/orders?orderStatus=shipped&modifyDateStart=${modifyStartDate}&modifyDateEnd=${modifyEndDate}&page=${page}&pageSize=500`;

  try {
    const orders = await utilities.fetchOrders(url);
    res.json(orders);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Process shipped orders and add new ones to the database
 */
export async function manageArchives(page = 1) {
  try {
    const now = new Date();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const url = `/orders?orderStatus=shipped&modifyDateStart=${twelveHoursAgo.toISOString()}&modifyDateEnd=${now.toISOString()}&page=${page}&pageSize=500`;

    const { orders, total, pages } = await utilities.fetchOrders(url);

    let allOrders = [...orders];

    if (pages > 1) {
      for (let x = 2; x <= pages; x++) {
        const nextURL = `/orders?orderStatus=shipped&modifyDateStart=${twelveHoursAgo.toISOString()}&modifyDateEnd=${now.toISOString()}&page=${x}&pageSize=500`;
        const { orders: additionalOrders } = await utilities.fetchOrders(nextURL);
        allOrders.push(...additionalOrders);
      }
    }

    await models.newArchive(allOrders);
  } catch (error) {
    console.error("Error:", error);
  }
}

/**
 * Process awaiting shipment orders and save new ones
 */
export async function manageAwaiting() {
  let page = 1;
  let allOrders = [];

  while (true) {
    const orders = await awaitingShipment(null, null, page);
    if (!orders || orders.length === 0) break;

    const newOrders = [];
    for (const order of orders) {
      const exists = await models.orderExists(order.orderNumber);
      if (!exists) newOrders.push(order);
    }

    if (newOrders.length > 0) await models.saveOrders(newOrders);
    allOrders.push(...orders);
    page += 1;
  }

  return allOrders;
}

/**
 * Process recovered shipped orders by date and add new ones to the DB
 */
export async function manageRecovered(date) {
  let page = 1;
  let allOrders = [];

  while (true) {
    const orders = await recoverData(null, null, page, date);
    if (!orders || orders.length === 0) break;

    const newOrders = [];
    for (const order of orders) {
      const exists = await models.orderExists(order.orderNumber);
      if (!exists) newOrders.push(order);
    }

    if (newOrders.length > 0) await models.saveOrders(newOrders);
    allOrders.push(...orders);
    page += 1;
  }

  return allOrders;
}
