const fs = require("fs").promises;
const crypto = require("crypto");
const multer = require("multer");
const Excel = require("exceljs");
const path = require("path");
const admin = require("firebase-admin");
const serviceAccount = require("..\\config\\serviceAccountsKey.json");

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize multer
const upload = multer({ storage: storage }).single("excelFile");

// // Initialize Firebase admin
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   databaseURL: "https://reportingapp---file-uploads.firebaseio.com",
// });

// // Initialize Firebase Storage
// const bucket = admin
//   .storage()
//   .bucket("reportingapp---file-uploads.appspot.com");

// Gets the daily count of products
function getCount(documents, date) {
  let itemCount = 0;
  documents.forEach((document) => {
    itemCount += document.items.length;
  });

  const customerNotes = documents.flatMap((document) =>
    (document.customerNotes || "").split(" | ").filter(Boolean)
  );

  const itemsSet = new Set(customerNotes);

  const string = {
    hats: "Matching Hat",
    bibs: "Matching Bib",
    miniBears: "Matching Bear",
    giftBaskets: "Gift Basket",
    towels: "Matching Towel",
    potHolders: "Matching Holder",
    bandanas: "Matched Bandana",
  };

  function countItems(item) {
    let count = 0;
    if (itemsSet.has(item)) {
      count = customerNotes.filter((note) => note === item).length;
    }
    return count;
  }

  const count = {
    productionDay: date,
    items: itemCount,
    hats: countItems(string.hats),
    bibs: countItems(string.bibs),
    miniBears: countItems(string.miniBears),
    giftBaskets: countItems(string.giftBaskets),
    FBA: countItems(string.FBA),
    towels: countItems(string.towels),
    potHolders: countItems(string.potHolders),
    bandanas: countItems(string.bandanas),
    totalItems: null,
    totalHours: null,
    itemsPerHour: null,
  };

  count.totalItems = Object.keys(count)
    .filter(
      (key) =>
        !["totalItems", "totalHours", "productionDay", "itemsPerHour"].includes(
          key
        )
    )
    .reduce((sum, key) => sum + count[key], 0);

  return count;
}

// Formats modify time of order
function getModifyTime(dateString) {
  // Get the time zone offset for Pacific Time
  const pacificTimeZoneOffset = -7 * 60; // Pacific Time

  // Get the time zone offset for Eastern Time
  const easternTimeZoneOffset = -4 * 60; // Eastern Time

  const date = new Date(dateString);

  // Get the time zone offset of the provided date
  const timeZoneOffset = date.getTimezoneOffset();

  // Convert PST/PDT to Eastern Time
  if (timeZoneOffset === pacificTimeZoneOffset) {
    date.setMinutes(
      date.getMinutes() + (pacificTimeZoneOffset - easternTimeZoneOffset)
    );
  }

  const formattedTime = date.toISOString().split("T")[0]; // Output in "yyyy-mm-dd" format

  return formattedTime;
}

function getEastCoastTime() {
  // Create a new Date object
  const now = new Date();

  // Get hours, minutes, and AM/PM
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Handle midnight

  // Format the time
  const formattedTime =
    hours + ":" + (minutes < 10 ? "0" : "") + minutes + " " + ampm;

  return formattedTime;
}

function parseTime(timeString) {
  const time = new Date();
  const pieces = timeString.match(/(\d+):(\d+) ([APap][Mm])/);
  let hours = parseInt(pieces[1]);
  const minutes = parseInt(pieces[2]);
  const period = pieces[3].toUpperCase();

  if (period === "PM" && hours < 12) {
    hours += 12;
  }

  time.setHours(hours, minutes);
  return time;
}

// Generates either today's day or tomorrow's day
function getProductionDay() {
  const options = { timeZone: "America/New_York" }; // Set the time zone to Eastern Time (ET)

  const formatDate = (dateString) => {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const today = new Date();
  const todaysDate = today.toLocaleString("en-US", options).split(",")[0];
  const formattedToday = formatDate(todaysDate);

  const tomorrowsDate = new Date(today);
  tomorrowsDate.setDate(today.getDate() + 1);
  const tomorrowsDateString = tomorrowsDate
    .toLocaleString("en-US", options)
    .split(",")[0];
  const formattedTomorrow = formatDate(tomorrowsDateString);

  return {
    today: formattedToday,
    tomorrow: formattedTomorrow,
  };
}

// Generates a randomn string to set the session id
function generateRandomString(length) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex") // Convert to hexadecimal representation
    .slice(0, length); // Trim to desired length
}

function itemsPerHour(items, hours) {
  if (hours === 0) {
    return 0;
  } else {
    return parseFloat((items / hours).toFixed(1));
  }
}

function formatDay(dateString) {
  const date = new Date(dateString);

  // Set the time zone to "America/New_York"
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  date.setTime(date.getTime() + 5 * 60 * 60 * 1000);

  const options = {
    weekday: "long",
    month: "numeric",
    day: "numeric",
    timeZone: "America/New_York",
  };

  const formattedDate = date.toLocaleDateString("en-US", options);

  // Remove commas from the formatted date
  const dateWithoutComma = formattedDate.replace(/,/g, "");

  console.log(dateWithoutComma);
  return dateWithoutComma;
}

function dateToDays(date) {
  return new Date(date).getTime() / (24 * 60 * 60 * 1000);
}

// async function handleFileUpload(req, res) {
//   return new Promise((resolve, reject) => {
//     upload(req, res, function (err) {
//       if (err instanceof multer.MulterError) {
//         // A Multer error occurred when uploading.
//         return res.status(500).json({ error: err.message });
//       } else if (err) {
//         // An unknown error occurred when uploading.
//         return res
//           .status(500)
//           .json({ error: "An error occurred while uploading the file." });
//       }
//       resolve(); // Resolve the promise when upload is successful
//     });
//   });
// }

async function handleFileUpload(req, res) {
  return new Promise((resolve, reject) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return res.status(500).json({ error: err.message });
      } else if (err) {
        // An unknown error occurred when uploading.
        return res
          .status(500)
          .json({ error: "An error occurred while uploading the file." });
      }
      resolve();

      // Upload file to Firebase Storage
      // const file = req.file;

      // if (!file) {
      //   return res.status(400).json({ error: "No file uploaded." });
      // }

      // const fileUpload = bucket.file(file.originalname);
      // const fileStream = fileUpload.createWriteStream({
      //   metadata: {
      //     contentType: file.mimetype,
      //   },
      // });

      // fileStream.on("error", (error) => {
      //   console.error("Error uploading file to Firebase Storage:", error);
      //   reject(error);
      // });

      // fileStream.on("finish", () => {
      //   console.log("File uploaded successfully to Firebase Storage.");
      //   resolve(); // Resolve the promise when upload is successful
      // });

      // fileStream.end(file.buffer);
    });
  });
}

async function deleteFiles(directory) {
  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await deleteFiles(filePath); // Recursively delete subdirectory
      } else {
        await fs.unlink(filePath); // Delete file
      }
    }

    // Delete file from Firebase Storage
    // const [FBfiles] = await bucket.getFiles();
    // const filenames = FBfiles.map((file) => {
    //   return file.name;
    // });
    // await bucket.file(filenames[0]).delete();
    // console.log(`File ${filenames[0]} deleted from Firebase Storage.`);
    
  } catch (error) {
    console.error("Error deleting files:", error);
  }
}
module.exports = {
  getCount,
  getModifyTime,
  getProductionDay,
  generateRandomString,
  itemsPerHour,
  getEastCoastTime,
  parseTime,
  formatDay,
  dateToDays,
  handleFileUpload,
  deleteFiles,
};
