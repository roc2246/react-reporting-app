const path = require("path");

const { MongoClient } = require("mongodb");
const { getProductionDay, itemsPerHour, dateToDays } = require("../utilities");

require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

// Create a function to connect to the MongoDB database
let client;

async function connectToDB() {
  try {
    if (!client) {
      client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
    }

    const db = client.db("cc-orders");

    return { db: db, client: client };
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Adds orders to mongodb database
async function newArchive(orders) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");
    const result = await collection.insertMany(orders);
    console.log(`${result.insertedCount} orders inserted successfully.`);
  } catch (error) {
    console.error("Error inserting orders:", error);
  }
}

async function newNotification(notifications) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("shipments-notified");
    const result = await collection.insertMany(notifications);
    console.log(`${result.insertedCount} notifications inserted successfully.`);
  } catch (error) {
    console.error("Error inserting notifications:", error);
  }
}

async function deleteData(collectionName) {
  return new Promise(async (resolve, reject) => {
    try {
      const { db } = await connectToDB();
      const collection = db.collection(collectionName);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Convert to ISO string and extract YYYY-MM-DD
      const formattedDate = sixtyDaysAgo.toISOString().split("T")[0];

      const query = { productionDay: { $lt: formattedDate } };

      const result = await collection.deleteMany(query);

      // Log the result of the deletion
      console.log("Deleted documents count:", result.deletedCount);

      resolve(result);
    } catch (err) {
      // Reject the promise if there's an error during deletion
      reject(err);
    }
  });
}

// Pulls mongoDB data based on collection name
async function getMongoData(collectionName) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection(collectionName);

    const query = {};
    const documents = await collection.find(query).toArray();
    return documents;
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

// Queries totals on the fly
async function queryOrdersByDate(date) {
  return new Promise(async (resolve, reject) => {
    try {
      const { db } = await connectToDB();
      const collection = db.collection("orders");

      const query = { productionDay: date };
      const projection = {
        items: 1,
        customerNotes: 1,
      };
      const stream = collection.find(query).project(projection).stream();

      const result = [];

      // Event listener for each document in the stream
      stream.on("data", (document) => {
        // Process each document
        result.push(document);
      });

      // Event listener when all documents have been processed
      stream.on("end", () => {
        // Resolve the promise with the collected data
        resolve(result);
      });

      // Event listener for errors during the streaming process
      stream.on("error", (err) => {
        // Reject the promise with the error
        reject(err);
      });
      return result;
    } catch (err) {
      // Reject the promise if there's an error during setup
      reject(err);
    }
  });
}

// Finds orders without productionday
async function unprocessedOrderIds() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");

    const query = { productionDay: { $exists: false } };

    const projection = {
      _id: 0, // Exclude the _id field
      orderId: 1,
    };

    const documents = await collection
      .find(query)
      .project(projection)
      .toArray();
    return documents;
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

async function shipIdsByDate(date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("shipments-notified");

    const projection = {
      _id: 0, // Exclude the _id field
      orderId: 1,
      // productionDay: 1,
    };

    const query = { productionDay: date };
    const documents = await collection
      .find(query)
      .project(projection)
      .toArray();
    return documents;
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

// Gets Daily Totals
// USE THIS FOR GETTING DATA OF THE DAY FOR DOWNLOAD
async function pullTotalDataOfDay(productionDay) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const query = { productionDay: productionDay };

    const dailyTotals = await collection.findOne(query);
    if (dailyTotals !== null && dailyTotals !== undefined) {
      return dailyTotals;
    } else {
      return {
        Error: "Totals have not been archived yet",
      };
    }
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

async function pullProductionDays() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const field = "productionDay";

    const productionDays = await collection.distinct(field);

    if (productionDays.length > 0) {
      return productionDays;
    } else {
      return {
        Error: "No documents available",
      };
    }
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

async function pullQueDays() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("order-que");

    const productionDays = await collection.distinct("productionDay");

    if (productionDays.length > 0) {
      return productionDays;
    } else {
      return {
        Error: "No documents available",
      };
    }
  } catch (err) {
    console.error("Error while processing the GET request:", err);
  }
}

// Creates a callback to use mongodb data
// USE THIS FOR GENERATING NUMBERS ON THE FLY
async function useStoredOrders(callback) {
  try {
    const storedOrders = await getMongoData("orders");
    callback(storedOrders);
  } catch (error) {
    console.error("Error while processing the GET request:", error);
    throw error;
  }
}

async function storeTotals(totals, date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const query = { productionDay: date };

    const exists = await collection.findOne(query);

    if (!exists) {
      collection.insertOne(totals);
    } else {
      collection.updateOne(query, {
        $set: {
          items: totals.items,
          hats: totals.hats,
          bibs: totals.bibs,
          miniBears: totals.miniBears,
          giftBaskets: totals.giftBaskets,
          FBA: totals.FBA,
          towels: totals.towels,
          potHolders: totals.potHolders,
          bandanas: totals.bandanas,
          totalItems: totals.totalItems,
          totalHours: totals.totalHours,
        },
      });
    }
  } catch (error) {
    console.error("Error inserting totals:", error);
  }
}

// Adds total work hours to daily-totals
async function addTotalHours(totalHours, date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    // Assuming you have a filter condition to identify the documents to update
    const filter = { productionDay: date };
    const totals = await collection.findOne(filter);

    const updateDoc = {
      $set: {
        totalHours: totalHours,
      },
    };

    const result = await collection.updateOne(filter, updateDoc);
    console.log(`${result.modifiedCount} document(s) updated`);
  } catch (error) {
    console.error("Error while processing the PUT request:", error);
    throw error;
  }
}

// Finds Total Hours
async function getTotalHours() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    // Assuming you have a filter condition to identify the documents to update
    const filter = { productionDay: getProductionDay().today };
    const totals = await collection.findOne(filter);

    if (totals !== null) {
      return totals.totalHours;
    } else {
      return 0;
    }
  } catch (error) {
    console.error("Error while processing the PUT request:", error);
    throw error;
  }
}

async function addFBA(FBA, date) {
  FBA = parseInt(FBA);
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const filter = { productionDay: date };
    const exists = await collection.findOne(filter);

    let result;
    exists.totalItems =
      exists.items +
      exists.hats +
      exists.bibs +
      exists.miniBears +
      exists.giftBaskets +
      exists.towels +
      exists.potHolders +
      exists.bandanas;
    const newTotalItems = exists.totalItems + FBA;
    if (exists && exists !== null) {
      exists.FBA = FBA;

      const updateDoc = {
        $set: {
          FBA: FBA,
          totalItems: newTotalItems,
        },
      };

      result = await collection.updateOne(filter, updateDoc);
      console.log(`${result.modifiedCount} document(s) updated`);
    } else {
      console.log(`Error: Totals haven't been calculated yet`);
    }
  } catch (error) {
    console.error("Error while processing the PUT request:", error);
    throw error;
  }
}

async function getFBANo() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const filter = { productionDay: getProductionDay().today };
    const totals = await collection.findOne(filter);

    if (totals !== null) {
      return totals.FBA;
    } else {
      return 0;
    }
  } catch (error) {
    console.error("Error while processing the PUT request:", error);
    throw error;
  }
}

// Finds login credentials
async function findUser(username) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("users");

    const query = { username: username };

    const user = await collection.findOne(query);

    if (user) {
      console.log(`User found`);
      return user; // Return the user object
    } else {
      console.log(`User not found`);
      return null; // Return null if user not found
    }
  } catch (error) {
    console.error("Error while finding user:", error);
    throw error;
  }
}

async function setProductionDay(no, date) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");

    const query = { orderId: no };

    collection.updateOne(query, {
      $set: {
        productionDay: date,
      },
    });
  } catch (error) {
    console.error("Error inserting production day:", error);
  }
}

async function getHistoricalRange(startDate, endDate) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const result = await collection
      .find({
        productionDay: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ productionDay: 1 })
      .toArray();

    for (let x = 0; x < result.length; x++) {
      const totalItems = result[x].totalItems;
      const totalHours = (Math.round(result[x].totalHours * 10) / 10).toFixed(
        1
      );

      result[x].itemsPerHour = itemsPerHour(totalItems, totalHours);

      if (result[x].itemsPerHour === "Infinity") {
        result[x].itemsPerHour = "N/A";
      }
    }

    return result;
  } catch (error) {
    console.error("Error inserting production day:", error);
  }
}

async function getOrderIDs(startDate, endDate) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");

    const orderIDs = await collection.distinct("orderId", {
      productionDay: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return orderIDs;
  } catch (error) {
    console.error("Error retrieving order Ids:", error);
  }
}

async function getAllOrderIDs() {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("orders");

    const projection = {
      orderId: 1,
    };

    const orderIDs = await collection.find({}).project(projection).toArray();

    return orderIDs;
  } catch (error) {
    console.error("Error retrieving order Ids:", error);
  }
}

async function updateExcelTotalHours(productionDay, hours) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("daily-totals");

    const query = { productionDay: productionDay };

    const result = await collection.updateOne(query, {
      $set: {
        totalHours: hours,
      },
    });

    if (result.modifiedCount === 1) {
      console.log(
        `Updated total hours for production day ${productionDay} to ${hours}`
      );
      return true;
    } else {
      console.log(
        `No document found for production day ${productionDay}, or ${productionDay} already is at ${hours} total hours`
      );
      return false;
    }
  } catch (error) {
    console.error("Error updating total hours:", error);
    throw error;
  }
}

async function orderVolumesReport(dates) {
  try {
    const { db } = await connectToDB();
    const que = db.collection("order-que");
    const dailyTotals = db.collection("daily-totals");

    // Aggregate data for each date
    const result = [];
    for (const date of dates) {
      const [queData, productionHours] = await Promise.all([
        que.findOne({ productionDay: date }),
        dailyTotals
          .aggregate([
            {
              $match: { productionDay: date },
            },
            {
              $project: {
                _id: 0,
                totalHours: { $round: ["$totalHours", 1] },
              },
            },
          ])
          .toArray(),
      ]);

      const totalHours =
        productionHours.length > 0 ? productionHours[0].totalHours : 0;

      const data = {
        productionDay: date,
        fiveAM: queData ? queData.fiveAM : 0,
        threePM: queData ? queData.threePM : 0,
        sixPM: queData ? queData.sixPM : 0,
        ninePM: queData ? queData.ninePM : 0,
        elevenPM: queData ? queData.elevenPM : 0,
        productionHours: totalHours,
      };

      result.push(data);
    }

    return result;
  } catch (error) {
    console.error("Error fetching historical range report:", error);
    throw error;
  }
}

async function addQueTotal(time) {
  try {
    const { db } = await connectToDB();
    const collection = db.collection("order-que");
    const todaysDate = getProductionDay().today;

    const que = await collection.find({ productionDay: todaysDate }).toArray();

    if (que.length === 0) {
      const queDate = {
        productionDay: todaysDate,
        fiveAM: 0,
        threePM: 0,
        sixPM: 0,
        ninePM: 0,
        elevenPM: 0,
      };
      await collection.insertOne(queDate);
    }

    const url = `https://reporting-app-3194629a4aed.herokuapp.com/awaiting-shipment?page=1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { total } = await response.json();

    await collection.updateOne(
      { productionDay: todaysDate },
      { $set: { [time]: total } }
    );
  } catch (error) {
    console.error("Error adding que total:", error);
    throw error;
  }
}



module.exports = {
  connectToDB,
  newArchive,
  newNotification,
  getMongoData,
  useStoredOrders,
  storeTotals,
  addTotalHours,
  findUser,
  getTotalHours,
  pullTotalDataOfDay,
  addFBA,
  getFBANo,
  pullProductionDays,
  pullQueDays,
  setProductionDay,
  getHistoricalRange,
  queryOrdersByDate,
  getOrderIDs,
  shipIdsByDate,
  unprocessedOrderIds,
  getAllOrderIDs,
  deleteData,
  updateExcelTotalHours,
  orderVolumesReport,
  addQueTotal,
};
