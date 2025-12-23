import * as regex from "../regex/index.js";
import { itemsPerHour as calculateItemsPerHour, getProductionDay as productionDayHelper } from "./index.js";
import sendEmail from "../email/index.js";

// Count items in orders
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
    return { quantity, keywords: note };
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

// Items per hour
export function itemsPerHour(items, hours) {
  if (!hours) return 0;
  return (Math.round((items / hours) * 10) / 10).toFixed(1);
}

// morningCounts function (async)
export async function morningCounts(shipments = async () => ({ orders: [], total: 0, pages: 1 })) {
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
        acc.push(`Name: ${order.billTo.name}, Order Number: ${orderNumberMatch[0]}, Item Code: ${itemCodeMatches.join(" ")}`);
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
