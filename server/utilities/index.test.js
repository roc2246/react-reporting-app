import { describe, it, expect, vi } from "vitest";
import { getProductionDay, getCount, morningCounts } from ".";
const testData = require("./test-data.json");

const pages = 6;
// Mock data for different pages
const page1Data = {
  orders: [
    {
      items: { quantity: 1 },
      customerNotes:
        "1059610............(1)CUT-SM-MON: LORELAI’S | KITCHEN | L | None | Matching Holder | .......",
    },
  ],
  total: 4,
  pages: pages,
  page: 1,
};

const page2Data = {
  orders: [
    {
      items: { quantity: 1 },
      customerNotes:
        '918784............(1)DC-GL-NOPNT: Pink | M: 14.5"-17.5" neck | Playful | No Designs | 405-240-2663 763-226-3683 | None | Matching Holder | .......',
    },
  ],
  total: 4,
  pages: pages,
  page: 2,
};

const page3Data = {
  orders: [
    {
      items: { quantity: 1 },
      customerNotes: null,
    },
  ],
  total: 4,
  pages: pages,
  page: 3,
};

const page4Data = {
  orders: [
    {
      orderId: 1144431189,
      items: { quantity: 1 },
      customerNotes:
        // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
        "918226............****DUPLICATES SEND 2 OF EACH**** (2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......(2)DB-LG: Beige | Playful | Bones | Chewie | High Contrast | .......",
      billTo: { name: "Delijah Fabela" },
    },
  ],
  total: 4,
  pages: pages,
  page: 4,
};

const page5Data = {
  orders: [
    {
      orderId: 1144431189,
      items: { quantity: 1 },
      customerNotes:
        // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
        "918226............****DUPLICATES SEND 2 OF EACH**** (2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......(2)DB-LG: Beige | Playful | Bones | Chewie | High Contrast | .......",
      billTo: { name: "Delijah Fabela" },
    },
  ],
  total: 4,
  pages: pages,
  page: 5,
};

const page6Data = {
  orders: [
    {
      orderId: 1144431189,
      items: { quantity: 1 },
      customerNotes:
        // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
        '918784............(1)DC-GL-PI-RD-NOPNT: Pink | M: 14.5"-17.5" neck | Playful | No Designs | 405-240-2663 763-226-3683 | None | Matching Holder | .......',
      billTo: { name: "Delijah Fabela" },
    },
  ],
  total: 4,
  pages: pages,
  page: 5,
};
const mockOrders = [
  ...page1Data.orders,
  ...page2Data.orders,
  ...page3Data.orders,
  ...page4Data.orders,
  ...page5Data.orders,
  ...page6Data.orders,
];

// Mock fetchAwaiting to return different data based on page number
const mockFetchAwaiting = vi.fn((pageNo) => {
  let returnedData;
  switch (pageNo) {
    case 1:
      returnedData = page1Data;
      break;
    case 2:
      returnedData = page2Data;
      break;
    case 3:
      returnedData = page3Data;
      break;
    case 4:
      returnedData = page4Data;
      break;
    case 5:
      returnedData = page5Data;
      break;
    case 6:
      returnedData = page6Data;
      break;
    default:
      return "ERROR";
  }
  return returnedData;
});
const mockRealistic = vi.fn(() => testData);

describe("getProductionDay", () => {
  it("should return object of production days", async () => {
    const results = getProductionDay();
    expect(typeof results).toBe("object");
    expect(results.thirtyOneDaysAgo).toBeDefined()
    expect(results.today).toBeDefined()
    expect(results.tomorrow).toBeDefined()
  });
});

describe("getCount", () => {
  it("should not pick up any Matching Holders under dog collars", () => {
    const count = getCount(mockOrders, "2024-09-01");
    expect(count.potHolders).toBe(1);
  });

  it("should return accurate results", () => {
    const count = getCount(testData.orders, "2024-09-01");
    const expectedResults = {
      productionDay: "2024-09-01",
      items: 384,
      hats: 63,
      bibs: 52,
      miniBears: 47,
      giftBaskets: 24,
      FBA: 0,
      towels: 0,
      potHolders: 0,
      bandanas: 2,
      totalItems: 572,
      totalHours: null,
      itemsPerHour: 0,
    };

    expect(count.items).toBe(expectedResults.items);
    expect(count.hats).toBe(expectedResults.hats);
    expect(count.bibs).toBe(expectedResults.bibs);
    expect(count.miniBears).toBe(expectedResults.miniBears);
    expect(count.giftBaskets).toBe(expectedResults.giftBaskets);
    expect(count.FBA).toBe(expectedResults.FBA);
    expect(count.towels).toBe(expectedResults.towels);
    expect(count.potHolders).toBe(expectedResults.potHolders);
    expect(count.bandanas).toBe(expectedResults.bandanas);
    expect(count.totalItems).toBe(expectedResults.totalItems);
  });
});

describe("morningCounts", () => {
  it("should return results from multiple pages", async () => {
    await morningCounts(mockFetchAwaiting);

    expect(mockFetchAwaiting).toHaveBeenCalledTimes(pages);
  });

  it("should show duplicate orders", async () => {
    const results = await morningCounts(mockFetchAwaiting);
    const duplicateRegex = /Duplicate Items:\s*([1-9]\d*)/;

    expect(duplicateRegex.test(results)).toBe(true);
  });

  it("should only count 'Matching Holder' if the add-on is for cutting boards", async () => {
    const results = await morningCounts(mockFetchAwaiting);
    const potholderRegex = /Pot Holders: 1/;

    expect(potholderRegex.test(results)).toBe(true);
  });
  it("should log orders from realistic data", async () => {
    console.log(await morningCounts(mockRealistic));
  });
  it("should detect bandana addons for pet blankets and pet mats", async () => {
    const orders = {
      orders: [
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-B-L | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-B-S | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-P-L | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-P-S | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-R-L | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-R-S | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-G-L | .......",
        },
        {
          customerNotes:
            "919482............(1)PM-FL-S: Maroon | Playful | Hearts | LILY  | Standard Contrast | Bandana-G-S | .......",
        },
      ],
    };
    const mockFunct = vi.fn(() => orders);
    const results = await morningCounts(mockFunct);
    const bandanaRegex = /Bandanas: 8/;
    expect(bandanaRegex.test(results)).toBe(true);
  });
  // it("should send morning counts to morningcounts@customcatch.simplelists.com", async () => {
  //   const results = await morningCounts(mockRealistic);
  //   const email = "morningcounts@customcatch.simplelists.com";
  //   await require("../email/index")(`Counts for test`, results, email);
  // });
  // it("should send error via email", async () => {
  //   const fail = "FAIL";
  //   const results = await morningCounts(fail);
  //   console.log(results);
  // });
});
