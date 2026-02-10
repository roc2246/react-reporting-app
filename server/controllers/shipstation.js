import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";
import https from "https";

/**
 * Returns orders awaiting shipment
 */
export async function awaitingShipment(req, res) {
  const page = req.query.page;
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
export async function recoverData(req, res) {
  const page = req.query.page;
  const date = req.query.date;
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
export async function manageArchives() {
  try {
    const now = new Date();
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const url = `/orders?orderStatus=shipped&modifyDateStart=${twelveHoursAgo.toISOString()}&modifyDateEnd=${now.toISOString()}&page=${1}&pageSize=500`;

    const { orders, total, pages } = await utilities.fetchOrders(url);

    let allOrders = [...orders];

    if (pages > 1) {
      for (let x = 2; x <= pages; x++) {
        const nextURL = `/orders?orderStatus=shipped&modifyDateStart=${twelveHoursAgo.toISOString()}&modifyDateEnd=${now.toISOString()}&page=${x}&pageSize=500`;
        const { orders: additionalOrders } =
          await utilities.fetchOrders(nextURL);
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

export async function manageShipmentsNotified(req, res) {
  try {
    const { resource_url: url } = req.body;

    // Immediately respond to webhook
    res.status(202).send("Request accepted, processing...");

    // Fetch the ShipStation shipment data
    const notification = await utilities.fetchOrders(url);
    const shipments = notification.shipments;

    const today = utilities.productionDay().today;
    const tomorrow = utilities.productionDay().tomorrow;

    // Add timestamps and production day
    Object.values(shipments).forEach((shipment) => {
      shipment.notificationDate = today;
      shipment.notificationTime = utilities.getEastCoastTime();
      shipment.productionDay =
        utilities.parseTime(shipment.notificationTime) <
        utilities.parseTime("5:00 PM")
          ? today
          : tomorrow;
    });

    console.log("ShipStation shipments notified:", shipments);

    await models.newNotification(shipments);
  } catch (error) {
    console.error("Error processing ShipStation shipments:", error);
  }
}
