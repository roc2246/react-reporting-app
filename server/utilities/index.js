const fs = require("fs").promises;
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const admin = require("firebase-admin");
const regex = require("../regex/index")

// Set multer storage engine
function setMulterStorage() {
  const storage = multer.memoryStorage();

  return multer({ storage: storage }).single("excelFile");
}

// Gets the daily count of products
function getCount(documents, date) {
  const itemRegex = regex.items();

  const customerNotes = documents.flatMap((order) => {
    return (order.customerNotes || "none")
      .split(" | .......")
      .filter((note) => note && note.trim() !== "none");
  });

  const parsedNotes = customerNotes.map((note) => {
    const quantityMatch = note.match(/\((\d+)\)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 0;
    const keywords = note;

    return {
      quantity,
      keywords,
    };
  });

  const quantities = documents
    .flatMap((item) => item.items)
    .flatMap((item) => item.quantity);

  // RETURN DATA
  const countItems = (regex) => {
    let count = 0;
    for (let x = 0; x < parsedNotes.length; x++) {
      const { quantity, keywords } = parsedNotes[x];
      const matches = keywords.match(regex);
      if (matches) {
        count += matches.length * quantity;
      }
    }
    return count;
  };

  
  const count = {
    productionDay: date,
    items: quantities.reduce((acc, item) => acc + item, 0),
    hats: countItems(itemRegex.hats),
    bibs: countItems(itemRegex.bibs),
    miniBears: countItems(itemRegex.miniBears),
    giftBaskets: countItems(itemRegex.giftBaskets),
    FBA: 0,
    towels: countItems(itemRegex.towels),
    potHolders: countItems(itemRegex.potHolders),
    bandanas: countItems(itemRegex.bandanas),
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

  count.itemsPerHour = itemsPerHour(count.totalItems, count.totalHours);

  return count;
}

async function fetchAwaiting(pageNo) {
  // FETCH AWAITING SHIPMENTS
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/awaiting-shipment?page=${pageNo}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function fetchShipped(pageNo) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/pull-orders?page=${pageNo}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Gets the morning counts
async function morningCounts(shipments = fetchAwaiting) {
  try {
    // FETCH ORDERS
    const { orders, total, pages } = await shipments(1);

    let allOrders = [...orders];

    if (pages > 1) {
      for (let x = 2; x <= pages; x++) {
        const { orders: additionalOrders } = await shipments(x);
        allOrders.push(...additionalOrders);
      }
    }

    // PARSE FOR RELEVANT DATA
    const noteRegex = regex.customerNotes();

    const itemRegex = regex.items();

    const customerNotes = allOrders.flatMap((order) => {
      return (order.customerNotes || "none")
        .split(" | .......")
        .filter((note) => note && note.trim() !== "none");
    });

    const parsedNotes = customerNotes.map((note) => {
      const quantityMatch = note.match(/\((\d+)\)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : 0;
      const keywords = note;

      return {
        quantity,
        keywords,
      };
    });

    const duplicates = allOrders.reduce((acc, order) => {
      const customerNote = order.customerNotes || "none";
      if (noteRegex.duplicate.test(customerNote)) {
        const itemCodeMatches = [
          ...customerNote.matchAll(noteRegex.itemCode),
        ].map((match) => match[1]);
        const orderNumberMatch = customerNote.match(noteRegex.orderNo);
        const result = `
          Name: ${order.billTo.name}
          Order Number: ${orderNumberMatch[0]}
          Item Code: ${itemCodeMatches.join(" ")}
        `;
        acc.push(result);
      }
      return acc;
    }, []);

    // RETURN DATA
    const count = (regex) => {
      let count = 0;
      for (let x = 0; x < parsedNotes.length; x++) {
        const { quantity, keywords } = parsedNotes[x];
        const matches = keywords.match(regex);
        if (matches) {
          count += matches.length * quantity;
        }
      }
      return count;
    };


    const summary = `
  Date: ${getProductionDay().today}
  Total Collars: ${count(itemRegex.collars)}
  Bandanas: ${count(itemRegex.bandanas)}
  Mats: ${count(itemRegex.mats.total)} 
  Small Mats: ${count(itemRegex.mats.small)}
  Large Mats: ${count(itemRegex.mats.large)}
  XL Mats: ${count(itemRegex.mats.xl)}
  Total Blankets: ${count(itemRegex.totalBlankets)}
  Dye Blankets: ${count(itemRegex.dyeBlankets)}
  Etch Blankets: ${count(itemRegex.etchBlankets)}
  Hats: ${count(itemRegex.hats)}
  Bibs: ${count(itemRegex.bibs)}
  Mini Bears: ${count(itemRegex.miniBears)}
  Gift Baskets: ${count(itemRegex.giftBaskets)}
  Total Throw Blankets: ${count(itemRegex.throwBlankets)}
  Total Bear Blankets: ${count(itemRegex.bearBlankets.total)}
  Pink Bear Blankets: ${count(itemRegex.bearBlankets.pink)}
  Blue Bear Blankets: ${count(itemRegex.bearBlankets.blue)}
  Brown Bear Blankets: ${count(itemRegex.bearBlankets.brown)}
  Unicorn Head Blankets: ${count(itemRegex.unicorn)}
  Trivets: ${count(itemRegex.trivets)}
  Cutting Boards: ${count(itemRegex.cuttingBoards)}
  Pot Holders: ${count(itemRegex.potHolders)}
  Towels ${count(itemRegex.towels)}
  Pet Blankets: ${count(itemRegex.petBlankets.total)}
  Small Pet Blankets: ${count(itemRegex.petBlankets.small)}
  Large Pet Blankets: ${count(itemRegex.petBlankets.large)}
  XL Pet Blankets: ${count(itemRegex.petBlankets.xl)}
  Total Order Count: ${total}
  Total Item Count: ${count(itemRegex.total)}
  Gift Wrapped Item Count: ${count(itemRegex.giftWrappedItem)}
  Duplicate Items: ${duplicates.length}
  Duplicate Details: ${duplicates}
`.trim();

    return summary;
  } catch (error) {
    console.error("Error retrieving morning counts:", error);
    await require("../email/index")("Error", error.stack)
    throw error;
  }
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

  const thirtyOneDaysAgoDate = new Date(today);
  thirtyOneDaysAgoDate.setDate(today.getDate() - 31);
  const thirtyOneDaysAgoDateString = thirtyOneDaysAgoDate
    .toLocaleString("en-US", options)
    .split(",")[0];
  const formattedThirtyOneDaysAgo = formatDate(thirtyOneDaysAgoDateString);

  return {
    thirtyOneDaysAgo: formattedThirtyOneDaysAgo,
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
  if (hours === 0 || hours === null) {
    return 0;
  } else {
    return (Math.round((items / hours) * 10) / 10).toFixed(1);
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

async function handleFileUpload(req, res) {
  // Verify user authentication
  if (!req.session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const upload = setMulterStorage();
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

      // Initialize Firebase Storage
      const bucket = admin
        .storage()
        .bucket("reportingapp---file-uploads.appspot.com");

      // Upload file to Firebase Storage
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const fileUpload = bucket.file(file.originalname);
      const fileStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      fileStream.on("error", (error) => {
        console.error("Error uploading file to Firebase Storage:", error);
        reject(error);
      });

      fileStream.on("finish", () => {
        console.log("File uploaded successfully to Firebase Storage.");
        resolve(); // Resolve the promise when upload is successful
      });

      fileStream.end(file.buffer);
    });
  });
}

async function deleteFiles() {
  try {
    // Delete file from Firebase Storage
    const bucket = admin
      .storage()
      .bucket("reportingapp---file-uploads.appspot.com");
    const [FBfiles] = await bucket.getFiles();
    const filenames = FBfiles.map((file) => {
      return file.name;
    });
    await bucket.file(filenames[0]).delete();
    console.log(`File ${filenames[0]} deleted from Firebase Storage.`);
  } catch (error) {
    console.error("Error deleting files:", error);
  }
}

function getDatesForWeeks(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  // Iterate over the weeks
  while (currentDate <= new Date(endDate)) {
    const formattedDate = currentDate.toISOString().split("T")[0];
    dates.push(formattedDate);
    currentDate = new Date(currentDate.getTime() + oneWeek);
  }

  return dates;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getWeekSpan() {
  const dates = [];
  let currentDate = getProductionDay().today;

  // Function to extract day, month, and year from date string
  const [year, month, day] = currentDate.split("-").map(Number);

  // Iterate over the days for a week
  for (let x = 0; x < 7; x++) {
    // Decrement the day by 1
    let tempDay = day - x;
    let tempMonth = month;
    let tempYear = year;

    // Check if the day goes to the previous month
    if (tempDay < 1) {
      // Adjust month and day accordingly
      tempMonth--;
      if (tempMonth < 1) {
        // If month goes to previous year, adjust year and month
        tempYear--;
        tempMonth = 12;
      }
      // Calculate the last day of the previous month
      const lastDayOfPrevMonth = new Date(tempYear, tempMonth, 0).getDate();
      tempDay = lastDayOfPrevMonth + tempDay;

      // Check if the previous month was February and if the year is a leap year
      if (tempMonth === 2 && isLeapYear(tempYear)) {
        tempDay++; // Adjust the day to 29th February
      }
    }

    // Format day, month, and year
    const formattedDay = String(tempDay).padStart(2, "0");
    const formattedMonth = String(tempMonth).padStart(2, "0");
    const formattedYear = String(tempYear);

    // Construct the date string
    const formattedDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;

    dates.push(formattedDate);
  }

  return dates.reverse(); // Reverse to get dates from current day to a week prior
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
  getDatesForWeeks,
  getWeekSpan,
  morningCounts,
  fetchShipped,
};
