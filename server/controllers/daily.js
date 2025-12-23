import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";
import { getCount } from "../utilities/index.js";

export async function dataOfDay(req, res) {
  try {
    const ordersToCount = await models.queryOrdersByDate(utilities.getProductionDay().today);
    const count = getCount(ordersToCount, utilities.getProductionDay().today);
    res.json(count);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}

export async function manageDailyTotals(data) {
  const totalHours = await models.getTotalHours();
  const totalFBA = await models.getFBANo();
  data.totalHours = totalHours;
  data.FBA = totalFBA;
  models.storeTotals(data, utilities.getProductionDay().today);
}

export async function getProductionDates(req, res) {
  try {
    const productionDay = await models.pullProductionDays();
    res.json(productionDay);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}

export async function getQueDates(req, res) {
  try {
    const queDays = await models.pullQueDays();
    res.json(queDays);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
}
