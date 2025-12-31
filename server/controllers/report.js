import Excel from "exceljs";
import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";

/**
 * Download summary of historical range with totals and items/hour
 */
export async function downloadRangeSummary(req, res, startDate, endDate, getHistoricalFn = models.getHistoricalRange) {
  try {
    const dailyTotals = await getHistoricalFn(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const grandTotals = { items: 0, hats: 0, totalHours: 0, itemsPerHour: 0 };

    for (const total of dailyTotals) {
      grandTotals.items += parseInt(total.items) || 0;
      grandTotals.hats += parseInt(total.hats) || 0;
      grandTotals.totalHours += total.totalHours || 0;
    }

    grandTotals.itemsPerHour = utilities.itemsPerHour(grandTotals.items, grandTotals.totalHours);

    Object.entries(grandTotals).forEach(([key, value]) => worksheet.addRow([key, value]));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=output.xlsx");

    await workbook.xlsx.write(res);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Download order IDs for a given date range
 */
export async function downloadOrderIDs(req, res, startDate, endDate, getOrderIDsFn = models.getOrderIDs) {
  try {
    const orderIDs = await getOrderIDsFn(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    orderIDs.forEach((id) => worksheet.addRow([id]));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=orderIDs.xlsx");

    await workbook.xlsx.write(res);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Download a historical range report with calculated metrics
 */
export async function downloadHistoricalRange(req, res, startDate, endDate, getHistoricalFn = models.getHistoricalRange) {
  try {
    const data = await getHistoricalFn(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("HistoricalRange");

    // Add headers
    worksheet.addRow(["Date", "Items", "Hats", "Hours"]);

    data.forEach((row) => {
      worksheet.addRow([row.date, row.items, row.hats, row.totalHours]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=historicalRange.xlsx");

    await workbook.xlsx.write(res);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Download order volumes report
 */
export async function getOrderVolumesReport(req, res, startDate, endDate, getVolumesFn = models.getOrderVolumes) {
  try {
    const volumes = await getVolumesFn(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("OrderVolumes");

    // Add headers
    worksheet.addRow(["OrderID", "Volume"]);

    volumes.forEach((row) => {
      worksheet.addRow([row.orderID, row.volume]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=orderVolumes.xlsx");

    await workbook.xlsx.write(res);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

export async function getSummarizedRange(req, res, startDate, endDate) {
  try {
    const historicalRange = await models.getHistoricalRange(startDate, endDate);
    res.json(historicalRange);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

export async function manageHistoricalRange(req, res, startDate, endDate) {
  try {
    const range = await models.getHistoricalRange(startDate, endDate);
    res.json(range);
  } catch (e) {
    console.log(`Error ${e}`);
  }
}