const https = require("https");
const path = require("path");
const fs = require("fs");
const models = require("../models/index");
const utilities = require("../utilities/index");
const moment = require("moment");
const Excel = require("exceljs");
const bcrypt = require("bcrypt");
const admin = require("firebase-admin");
const { getCount, generateRandomString } = require("../utilities/index");

require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

// FOR GENERATING PASSWORD__________________________________
async function hashString(inputString) {
  try {
    const saltRounds = 10;
    const hashedString = await bcrypt.hash(inputString, saltRounds);
    return hashedString;
  } catch (error) {
    console.error("Error hashing string:", error);
    throw error;
  }
}

// hashString(inputString)
//   .then(hashedString => {
//     console.log('Hashed string:', hashedString);
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });
// ___________________________________________________

// Set the session timeout duration in milliseconds (e.g., 30 minutes)
const sessionTimeout = 30 * 60 * 1000;

async function login(req, res) {
  const userExists = await models.findUser(req.body.username);

  if (userExists) {
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      userExists.password
    );

    if (passwordMatch) {
      // Authentication successful
      const sessionId = generateRandomString(20);
      const currentTime = Date.now();

      // Set session properties
      req.session.username = req.body.username;
      req.session.lastAccessed = currentTime;
      req.session.sessionId = sessionId;
      req.session.expiresAt = currentTime + sessionTimeout; // Calculate session expiration time

      res.status(200).redirect("/hours-and-fba.html");
    } else {
      // Password doesn't match
      res.status(401).send("Invalid credentials");
    }
  } else {
    // User not found
    res.status(401).send("Invalid credentials");
  }
}

function logout(req, res) {
  // Destroy the session or clear specific session properties
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      // Redirect to the login page after successful logout
      res.redirect("/login"); // Adjust the path to your login route
    }
  });
}

// Pull Data
function archiveOrders(req, res, page) {
  const pageSize = 500;

  const timespan = moment().subtract(12, "hours").toISOString();
  const url = `/orders?orderStatus=shipped&modifyDateStart=${encodeURIComponent(
    timespan
  )}&modifyDateEnd=${encodeURIComponent(
    moment().toISOString()
  )}&page=${page}&pageSize=${pageSize}`;

  const options = {
    hostname: process.env.BASE_URL,
    path: url,
    method: "GET",
    auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
  };

  const shipstationReq = https.request(options, (response) => {
    let data = "";

    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      const orders = JSON.parse(data);
      res.json(orders);
    });
  });

  shipstationReq.on("error", (e) => {
    console.error("Error fetching orders:", e);
    res.status(500).send("Internal Server Error");
  });

  shipstationReq.end();
}

function awaitingShipment(req, res, page) {
  const url = `/orders?orderStatus=awaiting_shipment&pageSize=500&page=${page}`;

  const options = {
    hostname: process.env.BASE_URL,
    path: url,
    method: "GET",
    auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
  };

  const shipstationReq = https.request(options, (response) => {
    let data = "";

    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      const orders = JSON.parse(data);
      res.json(orders);
    });
  });

  shipstationReq.on("error", (e) => {
    console.error("Error fetching orders:", e);
    res.status(500).send("Internal Server Error");
  });

  shipstationReq.end();
}

function recoverData(req, res, page, date) {
  const pageSize = 500;

  const currentDate = new Date(date);
  currentDate.setDate(currentDate.getDate() - 1);
  const prevDate = currentDate.toISOString().split("T")[0];

  const modifyStartDate = `${prevDate}T17:00:00.000Z`;
  const modifyEndDate = `${date}T16:59:59.999Z`;

  const url = `/orders?orderStatus=shipped&modifyDateStart=${modifyStartDate}&modifyDateEnd=${modifyEndDate}&page=${page}&pageSize=${pageSize}`;

  const options = {
    hostname: process.env.BASE_URL,
    path: url,
    method: "GET",
    auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
  };

  const shipstationReq = https.request(options, (response) => {
    let data = "";

    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      const orders = JSON.parse(data);
      res.json(orders);
    });
  });

  shipstationReq.on("error", (e) => {
    console.error("Error fetching orders:", e);
    res.status(500).send("Internal Server Error");
  });

  shipstationReq.end();
}

// Sets the count of items
async function dataOfDay(req, res) {
  try {
    const ordersToCount = await models.queryOrdersByDate(
      utilities.getProductionDay().today
    );

    const count = getCount(ordersToCount, utilities.getProductionDay().today);
    res.json(count);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.status(500).send("Internal Server Error");
  }
}

// Calculates the totals on the fly
async function totalsOnFly(req, res, date) {
  try {
    // Use async/await to retrieve the stored orders
    const documents = await models.queryOrdersByDate(date);

    // Check if there are no orders for the specified date
    if (documents.length === 0) {
      return res.status(400).json({ error: "No Date" });
    }

    // Calculate the count using the getCount function
    const count = getCount(documents, date);

    // Return the count in the response
    return res.json(count);
  } catch (e) {
    console.error("Error fetching orders:", e);
    return res.status(500).send("Internal Server Error");
  }
}

// Gets total data of day
async function getSummarizedRange(req, res, startDate, endDate) {
  try {
    const historicalRange = await models.getHistoricalRange(startDate, endDate);
    res.json(historicalRange);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

async function getProductionDates(req, res) {
  try {
    const productionDay = await models.pullProductionDays();
    res.json(productionDay);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

async function getQueDates(req, res) {
  try {
    const productionDay = await models.pullQueDays();
    res.json(productionDay);
  } catch (e) {
    console.error("Error fetching orders:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

/* HOLD OFF ON WEBSOCKET FUNCTIONALITY */
// async function getSummarizedRange(ws) {
//   try {
//     const dailyTotals = await models.pullTotalDataOfDay();
//     console.log(dailyTotals);
//     ws.send(JSON.stringify(dailyTotals)); // Send data to the WebSocket client
//   } catch (e) {
//     console.error("Error fetching orders:", e);
//     ws.send(JSON.stringify({ error: "Internal Server Error" })); // Send an error message
//   }
// }

// Add data
// COMMENT OUT ONCE WEB SOCKET IS FIGURED OUT
function includeTotalHours(req, res) {
  const totalHours = req.body.totalHours;
  const date = req.body.date;
  try {
    models.addTotalHours(totalHours, date);
    res.json({
      success: true,
      message: `TotalHours updated successfully to ${totalHours}`,
    });
  } catch (e) {
    console.error("Error fetching hours:", e);
    res.status(500).send("Internal Server Error");
  }
}

// UNCOMMENT ONCE WEB SOCKET IS FIGURED OUT
// function includeTotalHours(ws, message) {
//   const totalHours = message.totalHours;
//   try {
//     models.addTotalHours(totalHours);
//     ws.send(JSON.stringify({
//       success: true,
//       message: `TotalHours updated successfully to ${totalHours}`,
//     }));
//   } catch (e) {
//     console.error("Error updating total hours:", e);
//     ws.send(JSON.stringify({
//       success: false,
//       message: "Internal Server Error",
//     }));
//   }
// }

// COMMENT OUT ONCE WEB SOCKET IS FIGURED OUT
function includeFBA(req, res) {
  const FBA = req.body.FBA;
  const date = req.body.date;
  console.log(req.body);
  try {
    models.addFBA(FBA, date);
    res.json({
      success: true,
      message: `FBA updated successfully to ${FBA}`,
    });
  } catch (e) {
    console.error("Error fetching number:", e);
    res.status(500).send("Internal Server Error");
  }
}

async function downloadRangeSummary(req, res, startDate, endDate) {
  try {
    const dailyTotals = await models.getHistoricalRange(startDate, endDate);

    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const grandTotals = {
      from: `${startDate} to ${endDate}`,
      items: 0,
      hats: 0,
      bibs: 0,
      miniBears: 0,
      giftBaskets: 0,
      FBA: 0,
      towels: 0,
      potHolders: 0,
      bandanas: 0,
      totalItems: 0,
      totalHours: 0,
      itemsPerHour: 0,
    };

    for (const total in dailyTotals) {
      grandTotals.items += parseInt(dailyTotals[total].items);
      grandTotals.hats += parseInt(dailyTotals[total].hats);
      grandTotals.bibs += parseInt(dailyTotals[total].bibs);
      grandTotals.miniBears += parseInt(dailyTotals[total].miniBears);
      grandTotals.giftBaskets += parseInt(dailyTotals[total].giftBaskets);
      grandTotals.FBA += parseInt(dailyTotals[total].FBA);
      grandTotals.towels += parseInt(dailyTotals[total].towels);
      grandTotals.potHolders += parseInt(dailyTotals[total].potHolders);
      grandTotals.bandanas += parseInt(dailyTotals[total].bandanas);
      grandTotals.totalItems += parseInt(dailyTotals[total].totalItems);
      grandTotals.totalHours += dailyTotals[total].totalHours;
    }
    grandTotals.totalHours = (
      Math.round(grandTotals.totalHours * 10) / 10
    ).toFixed(1);
    grandTotals.itemsPerHour = utilities.itemsPerHour(
      grandTotals.totalItems,
      grandTotals.totalHours
    );

    if (dailyTotals.length === 0) {
      const ordersToCount = await models.queryOrdersByDate(
        utilities.getProductionDay().today
      );
      const count = getCount(ordersToCount, utilities.getProductionDay().today);
      const keys = Object.keys(count);
      const values = Object.values(count);
      for (let no in keys) {
        if (
          (keys[no] === "totalHours" && values[no] === null) ||
          (keys[no] === "itemsPerHour" && values[no] === null)
        ) {
          worksheet.addRow([keys[no], "N/A"]);
        } else {
          worksheet.addRow([keys[no], values[no]]);
        }
        console.log(`${keys[no]}: ${values[no]}`);
      }
    } else {
      const keys = Object.keys(grandTotals);
      const values = Object.values(grandTotals);
      for (let no in keys) {
        worksheet.addRow([keys[no], values[no]]);
        console.log(`${keys[no]}: ${values[no]}`);
      }
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=output.xlsx");

    workbook.xlsx
      .write(res)
      .then(() => {
        console.log("Excel file sent");
      })
      .catch((err) => {
        res.status(500).send("Error sending the Excel file");
      });
  } catch (e) {
    console.error("Error downloading report:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

async function downloadOrderIDs(req, res, startDate, endDate) {
  try {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    worksheet.addRow(["Production Dates", `${startDate} to ${endDate}`]);
    const orderIDs = await models.getOrderIDs(startDate, endDate);
    for (let ID in orderIDs) {
      worksheet.addRow(["OrderId", orderIDs[ID]]);
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=output.xlsx");

    workbook.xlsx
      .write(res)
      .then(() => {
        console.log("Excel file sent");
      })
      .catch((err) => {
        res.status(500).send("Error sending the Excel file");
      });
  } catch (e) {
    console.error("Error downloading report:", e);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}

async function manageShipstationOrders(orders) {
  try {
    const orderIds = await models.getAllOrderIDs();

    const orderIdSet = new Set(orderIds.map((keyValue) => keyValue.orderId));

    // Filter out orders that are already in the MongoDB database
    const newOrders = orders.filter((order) => !orderIdSet.has(order.orderId));

    // Log New Orders
    console.log(newOrders);

    // Archive new orders that aren't in the MongoDB database
    if (newOrders.length > 0) {
      await models.newArchive(newOrders);
      console.log(`${newOrders.length} orders added to the database.`);
    } else {
      console.log(
        `All orders on the page have already been added to the database.`
      );
    }
  } catch (error) {
    console.error("Error in manageShipstationOrders:", error);
  }
}

async function manageArchives(
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
    await require("../email/index")("Error", error.stack.toString());
  }
}

// Manage daily totals
async function manageDailyTotals(data) {
  const totalHours = await models.getTotalHours();
  const totalFBA = await models.getFBANo();
  data.totalHours = totalHours;
  data.FBA = totalFBA;

  models.storeTotals(data, utilities.getProductionDay().today);

  console.log("Totals archived");
}

// Manages shipstation webhook
async function manageShipmentsNotified(req, res) {
  try {
    const payload = req.body;
    const resourceUrl = payload.resource_url;

    const url = resourceUrl;

    res.status(202).send("Request accepted, processing...");

    const options = {
      hostname: process.env.BASE_URL,
      path: url,
      method: "GET",
      auth: `${process.env.API_KEY}:${process.env.API_SECRET}`,
    };

    function getDataFromExternalService() {
      return new Promise((resolve, reject) => {
        const getRequest = https.request(options, (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            resolve(data);
          });
        });

        getRequest.on("error", (e) => {
          reject(e);
        });

        getRequest.end();
      });
    }

    const data = await getDataFromExternalService();
    const notification = JSON.parse(data);

    const shipments = notification.shipments;

    for (let shipment in shipments) {
      shipments[shipment].notificationDate = utilities.getProductionDay().today;
      shipments[shipment].notificationTime = utilities.getEastCoastTime();
    }

    // Adds production day
    for (let time in shipments) {
      if (
        utilities.parseTime(shipments[time].notificationTime) <
        utilities.parseTime("5:00 PM")
      ) {
        shipments[time].productionDay = utilities.getProductionDay().today;
      } else {
        shipments[time].productionDay = utilities.getProductionDay().tomorrow;
      }
    }

    console.log(shipments);

    models.newNotification(shipments);
  } catch (error) {
    console.error(error);
  }
}

async function manageHistoricalRange(req, res, startDate, endDate) {
  try {
    const range = await models.getHistoricalRange(startDate, endDate);
    res.json(range);
  } catch (e) {
    console.log(`Error ${e}`);
  }
}

// Controller function to download data from MongoDB and export to Excel
async function downloadHistoricalRange(req, res, startDate, endDate) {
  try {
    // Get data from the model
    const data = await models.getHistoricalRange(startDate, endDate);

    // Create a new Excel workbook
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Extract product types and production days
    const productTypes = Object.keys(data[0]).filter(
      (key) => key !== "productionDay" && key !== "_id"
    );
    const productionDays = data.map((row) => row.productionDay);

    // Add headers to the Excel worksheet
    worksheet.columns = [
      { header: "Product Type", key: "productType", width: 20 }, // Adjust column width as needed
      ...productionDays.map((day) => ({
        header: utilities.formatDay(day),
        key: day,
        width: 10,
      })), // Adjust column width as needed
      { header: `${productionDays.length} Day Total`, key: "total", width: 10 }, // New column for totals
    ];

    // Add data to the Excel worksheet
    productTypes.forEach((productType) => {
      const rowData = { productType };
      let rowTotal = 0;

      productionDays.forEach((day) => {
        const matchingRow = data.find((row) => row.productionDay === day);
        let value = matchingRow ? matchingRow[productType] : null;
        const formatDecimals =
          productType === "totalHours"
            ? (Math.round(value * 10) / 10).toFixed(1)
            : value;

        rowData[day] = formatDecimals;

        if (
          productType === "totalHours" &&
          (value === 0 || value === undefined)
        ) {
          rowData[day] = "N/A";
        }
        if (productType === "itemsPerHour" && (value === 0 || isNaN(value))) {
          rowData[day] = "N/A";
        }
        rowTotal += parseFloat(value) || 0; // Add the value to the total, handling null values
      });

      if (
        productType === "totalHours" &&
        (rowTotal === 0 || rowTotal === undefined)
      ) {
        rowTotal = "N/A";
      }

      if (
        productType === "itemsPerHour" &&
        (rowTotal === 0 || isNaN(rowTotal))
      ) {
        rowTotal = "N/A";
      } else {
        rowData.total = rowTotal;
      }
      if (productType === "totalHours") {
        rowData.total = (Math.round(rowData.total * 10) / 10).toFixed(1);
      }

      worksheet.addRow(rowData);
    });

    // Set the value of the last cell in the 'Total' column to the rounded result of the division
    const lastRowNumber = worksheet.rowCount;
    const totalColumn = worksheet.columns.length;
    const dividend = worksheet.getCell(lastRowNumber - 2, totalColumn).value;
    const divisor = worksheet.getCell(lastRowNumber - 1, totalColumn).value;
    const result = dividend / divisor;

    // Set the rounded result to one decimal places
    worksheet.getCell(lastRowNumber, totalColumn).value = isNaN(result)
      ? "N/A"
      : Number(result.toFixed(1));

    // Save the Excel workbook to a file
    const excelFilePath = "output.xlsx";
    await workbook.xlsx.writeFile(excelFilePath);

    // Send the Excel file to the client for download
    res.download(excelFilePath);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function loadHours(req, res) {
  try {
    // Handle file upload to Firebase Storage
    await utilities.handleFileUpload(req, res);

    // Initialize Firebase Storage bucket
    const bucket = admin
      .storage()
      .bucket("reportingapp---file-uploads.appspot.com");
    const [files] = await bucket.getFiles();

    // Ensure a file is available
    if (files.length === 0) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    // Get the file from Firebase Storage
    const file = files[0];
    const fileStream = file.createReadStream();

    // Parse the file using Exceljs
    const workbook = new Excel.Workbook();
    await workbook.xlsx.read(fileStream);

    const worksheet = workbook.getWorksheet(1);
    const dailyHours = {};

    worksheet.eachRow((row, rowNumber) => {
      const date = row.getCell(1).value.toISOString().split("T")[0];
      const hours = row.getCell(2).value.toFixed(1);

      dailyHours[date] = parseFloat(hours);
    });

    // Update total hours in the database
    for (const [date, hours] of Object.entries(dailyHours)) {
      await models.updateExcelTotalHours(date, hours);
    }

    res.status(200).send(dailyHours);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  } finally {
    await utilities.deleteFiles();
  }
}

async function getOrderVolumesReport(req, res, startDate, endDate) {
  try {
    if (startDate === undefined)
      startDate = utilities.getProductionDay().thirtyOneDaysAgo;
    if (endDate === undefined) endDate = utilities.getProductionDay().today;

    const selectDates = utilities.getDatesForWeeks(startDate, endDate);

    const ques = await models.orderVolumesReport(selectDates);
    res.status(200).send(ques);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

async function getWeeksVolumesReport(req, res) {
  try {
    const selectDates = utilities.getWeekSpan();
    const ques = await models.orderVolumesReport(selectDates);
    res.status(200).send(ques);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  archiveOrders,
  recoverData,
  awaitingShipment,
  dataOfDay,
  includeTotalHours,
  login,
  logout,
  manageShipstationOrders,
  manageDailyTotals,
  getSummarizedRange,
  includeFBA,
  getProductionDates,
  getQueDates,
  downloadRangeSummary,
  totalsOnFly,
  downloadOrderIDs,
  manageShipmentsNotified,
  manageHistoricalRange,
  downloadHistoricalRange,
  loadHours,
  getOrderVolumesReport,
  getWeeksVolumesReport,
  manageArchives
};
