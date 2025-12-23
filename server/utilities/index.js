import fs from "fs/promises";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import admin from "firebase-admin";
import * as regex from "../regex/index.js";
import { itemsPerHour as calculateItemsPerHour, getProductionDay as productionDayHelper } from "./index.js"; // import helper functions if needed
import sendEmail from "../email/index.js"; // assuming default export

// Set multer storage engine
export function setMulterStorage() {
  const storage = multer.memoryStorage();
  return multer({ storage }).single("excelFile");
}

// Gets the daily count of products
export function getCount(documents, date) {
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

    return { quantity, keywords };
  });

  const quantities = documents.flatMap((item) => item.items).flatMap((item) => item.quantity);

  const countItems = (regex) => {
    let count = 0;
    for (const { quantity, keywords } of parsedNotes) {
      const matches = keywords.match(regex);
      if (matches) count += matches.length * quantity;
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
    .filter((key) => !["totalItems", "totalHours", "productionDay", "itemsPerHour"].includes(key))
    .reduce((sum, key) => sum + count[key], 0);

  count.itemsPerHour = calculateItemsPerHour(count.totalItems, count.totalHours);

  return count;
}

export async function fetchAwaiting(pageNo) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/awaiting-shipment?page=${pageNo}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

export async function fetchShipped(pageNo) {
  const url = `https://reporting-app-3194629a4aed.herokuapp.com/pull-orders?page=${pageNo}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return await response.json();
}

// Gets the morning counts
export async function morningCounts(shipments = fetchAwaiting) {
  try {
    const { orders, total, pages } = await shipments(1);
    let allOrders = [...orders];
    if (pages > 1) {
      for (let x = 2; x <= pages; x++) {
        const { orders: additionalOrders } = await shipments(x);
        allOrders.push(...additionalOrders);
      }
    }

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
      return { quantity, keywords: note };
    });

    const duplicates = allOrders.reduce((acc, order) => {
      const customerNote = order.customerNotes || "none";
      if (noteRegex.duplicate.test(customerNote)) {
        const itemCodeMatches = [...customerNote.matchAll(noteRegex.itemCode)].map((match) => match[1]);
        const orderNumberMatch = customerNote.match(noteRegex.orderNo);
        acc.push(`
          Name: ${order.billTo.name}
          Order Number: ${orderNumberMatch[0]}
          Item Code: ${itemCodeMatches.join(" ")}
        `);
      }
      return acc;
    }, []);

    const count = (regex) => {
      let total = 0;
      for (const { quantity, keywords } of parsedNotes) {
        const matches = keywords.match(regex);
        if (matches) total += matches.length * quantity;
      }
      return total;
    };

    const summary = `
  Date: ${productionDayHelper().today}
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
  Towels: ${count(itemRegex.towels)}
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
    await sendEmail("Error", error.stack);
    throw error;
  }
}

// Other helper functions
export function getModifyTime(dateString) {
  const pacificTimeZoneOffset = -7 * 60;
  const easternTimeZoneOffset = -4 * 60;
  const date = new Date(dateString);
  const timeZoneOffset = date.getTimezoneOffset();
  if (timeZoneOffset === pacificTimeZoneOffset) {
    date.setMinutes(date.getMinutes() + (pacificTimeZoneOffset - easternTimeZoneOffset));
  }
  return date.toISOString().split("T")[0];
}

export function getEastCoastTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes < 10 ? "0" : ""}${minutes} ${ampm}`;
}

export function parseTime(timeString) {
  const time = new Date();
  const pieces = timeString.match(/(\d+):(\d+) ([APap][Mm])/);
  let hours = parseInt(pieces[1]);
  const minutes = parseInt(pieces[2]);
  const period = pieces[3].toUpperCase();
  if (period === "PM" && hours < 12) hours += 12;
  time.setHours(hours, minutes);
  return time;
}

export function getProductionDay() {
  const options = { timeZone: "America/New_York" };
  const formatDate = (dateString) => {
    const [month, day, year] = dateString.split("/");
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };
  const today = new Date();
  const formattedToday = formatDate(today.toLocaleString("en-US", options).split(",")[0]);

  const tomorrowsDate = new Date(today);
  tomorrowsDate.setDate(today.getDate() + 1);
  const formattedTomorrow = formatDate(tomorrowsDate.toLocaleString("en-US", options).split(",")[0]);

  const thirtyOneDaysAgoDate = new Date(today);
  thirtyOneDaysAgoDate.setDate(today.getDate() - 31);
  const formattedThirtyOneDaysAgo = formatDate(thirtyOneDaysAgoDate.toLocaleString("en-US", options).split(",")[0]);

  return { thirtyOneDaysAgo: formattedThirtyOneDaysAgo, today: formattedToday, tomorrow: formattedTomorrow };
}

export function generateRandomString(length) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex").slice(0, length);
}

export function itemsPerHour(items, hours) {
  if (!hours) return 0;
  return (Math.round((items / hours) * 10) / 10).toFixed(1);
}

export function formatDay(dateString) {
  const date = new Date(dateString);
  date.setTime(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
  date.setTime(date.getTime() + 5 * 60 * 60 * 1000);
  const options = { weekday: "long", month: "numeric", day: "numeric", timeZone: "America/New_York" };
  return date.toLocaleDateString("en-US", options).replace(/,/g, "");
}

export function dateToDays(date) {
  return new Date(date).getTime() / (24 * 60 * 60 * 1000);
}

export async function handleFileUpload(req, res) {
  if (!req.session) return res.status(401).json({ error: "Unauthorized" });
  const upload = setMulterStorage();
  return new Promise((resolve, reject) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) return res.status(500).json({ error: err.message });
      if (err) return res.status(500).json({ error: "An error occurred while uploading the file." });

      const bucket = admin.storage().bucket("reportingapp---file-uploads.appspot.com");
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded." });

      const fileUpload = bucket.file(file.originalname);
      const fileStream = fileUpload.createWriteStream({ metadata: { contentType: file.mimetype } });

      fileStream.on("error", reject);
      fileStream.on("finish", resolve);
      fileStream.end(file.buffer);
    });
  });
}

export async function deleteFiles() {
  try {
    const bucket = admin.storage().bucket("reportingapp---file-uploads.appspot.com");
    const [FBfiles] = await bucket.getFiles();
    if (FBfiles.length > 0) {
      await bucket.file(FBfiles[0].name).delete();
      console.log(`File ${FBfiles[0].name} deleted from Firebase Storage.`);
    }
  } catch (error) {
    console.error("Error deleting files:", error);
  }
}

export function getDatesForWeeks(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  while (currentDate <= new Date(endDate)) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate = new Date(currentDate.getTime() + oneWeek);
  }
  return dates;
}

export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getWeekSpan() {
  const dates = [];
  let [year, month, day] = getProductionDay().today.split("-").map(Number);

  for (let x = 0; x < 7; x++) {
    let tempDay = day - x;
    let tempMonth = month;
    let tempYear = year;

    if (tempDay < 1) {
      tempMonth--;
      if (tempMonth < 1) { tempYear--; tempMonth = 12; }
      const lastDayOfPrevMonth = new Date(tempYear, tempMonth, 0).getDate();
      tempDay = lastDayOfPrevMonth + tempDay;
      if (tempMonth === 2 && isLeapYear(tempYear)) tempDay++;
    }

    const formattedDay = String(tempDay).padStart(2, "0");
    const formattedMonth = String(tempMonth).padStart(2, "0");
    const formattedYear = String(tempYear);
    dates.push(`${formattedYear}-${formattedMonth}-${formattedDay}`);
  }

  return dates.reverse();
}
