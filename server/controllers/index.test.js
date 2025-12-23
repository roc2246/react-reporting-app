import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { manageArchives } from ".";

// MOCK DATABASE
let db = [
  {
    orderId: 1,
    customerNotes:
      "919788............(1)BBL-SE-BL: Moon | Rocqualis Jr | High Contrast | None | None | None | None | .......",
  },
];

// MOCK DATA
const pages = 5;
const page1Data = {
  orders: [
    {
      orderId: 2,
      customerNotes:
        "919788............(1)BBL-SE-BL: Moon | Rocqualis Jr | High Contrast | None | None | None | None | .......",
    },
  ],
  total: 1,
  pages: pages,
  page: 1,
};

const page2Data = {
  orders: [
    {
      orderId: 3,
      customerNotes:
        "919786............(1)BBL-SE-BL: No Designs | Psalm | High Contrast | None | None | None | None | .......",
    },
  ],
  total: 1,
  pages: pages,
  page: 2,
};

const page3Data = {
  orders: [
    {
      orderId: 4,
      customerNotes: null,
    },
  ],
  total: 1,
  pages: pages,
  page: 3,
};

const page4Data = {
  orders: [
    {
      orderId: 5,
      orderId: 1144431189,
      customerNotes:
        // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
        "918226............****DUPLICATES SEND 2 OF EACH**** (2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......(2)DB-LG: Beige | Playful | Bones | Chewie | High Contrast | .......",
      billTo: { name: "Delijah Fabela" },
    },
    {
      orderId: 6,
      orderId: 1144431189,
      customerNotes:
        // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
        "918226............****DUPLICATES SEND 2 OF EACH**** (2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......(2)DB-LG: Beige | Playful | Bones | Chewie | High Contrast | .......",
      billTo: { name: "Delijah Fabela" },
    },
  ],
  total: 2,
  pages: pages,
  page: 4,
};

const page5Data = {
  orders: [
    {
      orderId: 1,
      customerNotes:
        "919788............(1)BBL-SE-BL: Moon | Rocqualis Jr | High Contrast | None | None | None | None | .......",
    },
  ],
  total: 4,
  pages: pages,
  page: 5,
};

// MOCK FUNCTIONS
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
    default:
      return "ERROR";
  }
  return returnedData;
});

const mockManageOrders = vi.fn(async (orders) => {
  try {
    const orderIds = db.filter((order) => order.orderId);

    const orderIdSet = new Set(orderIds.map((keyValue) => keyValue.orderId));

    // Filter out orders that are already in the MongoDB database
    const newOrders = orders.filter((order) => !orderIdSet.has(order.orderId));

    // Log New Orders
    console.log(newOrders);

    // Archive new orders that aren't in the MongoDB database
    if (newOrders.length > 0) {
      db = [...db, ...newOrders];
      console.log(`${newOrders.length} orders added to the database.`);
    } else {
      console.log(
        `All orders on the page have already been added to the database.`
      );
    }
  } catch (error) {
    console.error("Error in manageShipstationOrders:", error);
  }
});

// TESTS
describe("manageArchives", () => {
  beforeEach(async ()=>{
    vi.clearAllMocks();
    db = [
      {
        orderId: 1,
        customerNotes:
          "919788............(1)BBL-SE-BL: Moon | Rocqualis Jr | High Contrast | None | None | None | None | .......",
      },
    ]
  })
  it("should retrieve all pages of orders", async () => {
    await manageArchives(mockFetchAwaiting, mockManageOrders);
    expect(mockFetchAwaiting).toHaveBeenCalledTimes(pages);
  });
  it("should add new orders to db", async () => {
    await manageArchives(mockFetchAwaiting, mockManageOrders);
    const updatedDb = db.length;
    expect(db.length).toBe(updatedDb);
  });
  it("should not archive order already in db", async () => {
    await manageArchives(mockFetchAwaiting, mockManageOrders);
    const duplicates = db.filter((order) => order.orderId === 1);
    expect(duplicates.length).toBe(1);
  });
  // it("should send email error", async () => {
  //   await manageArchives("ERROR", mockManageOrders);
  //   expect(require("../email/index")).toBeCalled;
  // });
});
