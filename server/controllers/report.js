import Excel from "exceljs";
import * as models from "../models/index.js";
import * as utilities from "../utilities/index.js";

/**
 * Download summary of historical range with totals and items/hour
 */
export async function downloadRangeSummary(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const dailyTotals = await models.getHistoricalRange(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const grandTotals = { items: 0, hats: 0, totalHours: 0, itemsPerHour: 0 };

    for (const total of dailyTotals) {
      grandTotals.items += parseInt(total.items) || 0;
      grandTotals.hats += parseInt(total.hats) || 0;
      grandTotals.totalHours += total.totalHours || 0;
    }

    grandTotals.itemsPerHour = utilities.itemsPerHour(
      grandTotals.items,
      grandTotals.totalHours,
    );

    Object.entries(grandTotals).forEach(([key, value]) =>
      worksheet.addRow([key, value]),
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
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
export async function downloadOrderIDs(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const orderIDs = await models.getOrderIDs(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Orders");

    orderIDs.forEach((id) => worksheet.addRow([id]));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
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
export async function downloadHistoricalRange(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const data = await models.getHistoricalRange(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("HistoricalRange");

    // Add headers
    worksheet.addRow(["Date", "Items", "Hats", "Hours"]);

    data.forEach((row) => {
      worksheet.addRow([row.date, row.items, row.hats, row.totalHours]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=historicalRange.xlsx",
    );

    await workbook.xlsx.write(res);
  } catch (err) {
    console.error(err);
    if (res?.status && res.send) res.status(500).send("Internal Server Error");
  }
}

/**
 * Download order volumes report
 */
export async function getOrderVolumesReport(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    if (startDate === undefined)
      startDate = utilities.productionDay().thirtyOneDaysAgo;
    if (endDate === undefined) endDate = utilities.productionDay().today;

    const selectDates = utilities.getDatesForWeeks(startDate, endDate);

    const ques = await models.orderVolumesReport(selectDates);
    res.status(200).send(ques);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

export async function getSummarizedRange(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const historicalRange = await models.getHistoricalRange(startDate, endDate);
    res.json(historicalRange);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

export async function manageHistoricalRange(req, res) {
  try {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const range = await models.getHistoricalRange(startDate, endDate);
    res.json(range);
  } catch (e) {
    console.log(`Error ${e}`);
  }
}
export async function getWeeksVolumesReport(req, res) {
  try {
    const selectDates = utilities.getWeekSpan();
    const ques = await models.orderVolumesReport(selectDates);
    res.status(200).send(ques);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}
