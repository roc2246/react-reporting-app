import { describe, it, expect, vi, beforeEach } from "vitest";
import * as models from ".";
import path from "path";
import { MongoClient } from "mongodb";

require("dotenv").config({
  path: path.join(__dirname, "../config/.env"),
});

describe("test for local env variables", () => {
  it("should load local env variables", () => {
    const URI = "mongodb://localhost:27017/";

    expect(process.env.MONGODB_URI).toBe(URI);
  });
});

if (process.env.MONGODB_URI === "mongodb://localhost:27017/") {
  describe("connectToDB", () => {
    it("creates a new MongoClient and connects", async () => {
      const connectSpy = vi.spyOn(MongoClient.prototype, "connect");
      const dbSpy = vi.spyOn(MongoClient.prototype, "db");

      const result = await models.connectToDB();

      expect(connectSpy).toHaveBeenCalledOnce();
      expect(dbSpy).toHaveBeenCalledWith("cc-orders");
      expect(result.db).toBeDefined();
      expect(result.client).toBeDefined();
    });
  });

  describe("newArchive", () => {
    it("should add dummy orders to local db", async () => {
      const mockOrders = [
        {
          orderId: 10111,
          productionDay: "2024-02-02",
          customerNotes:
            // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
            '918784............(1)DC-GL-PI-RD-NOPNT: Pink | M: 14.5"-17.5" neck | Playful | No Designs | 405-240-2663 763-226-3683 | None | Matching Holder | .......',
        },
        {
          orderId: 10112,
          productionDay: "2025-02-02",
          customerNotes:
            // "918226............(2)DB-LG: Gray | Playful | Hearts | Cheenah | High Contrast | .......",
            '918784............(1)DC-GL-PI-RD-NOPNT: Pink | M: 14.5"-17.5" neck | Playful | No Designs | 405-240-2663 763-226-3683 | None | Matching Holder | .......',
        },
      ];
      await models.newArchive(mockOrders);
    });
  });

  describe("dailyTotals", () => {
    it("should add mock totals to local db", async () => {
      const mockDate = "2024-02-24";
      const mockTotals = {
        productionDay: mockDate,
        items: 488,
        hats: 12,
        bibs: 12,
        miniBears: 12,
        giftBaskets: 12,
        FBA: 12,
        towels: 12,
        potHolders: 12,
        bandanas: 12,
        totalItems: 12,
        totalHours: 12,
      };
      await models.storeTotals(mockTotals, mockDate);
    });
    it("should update mock totals in local db", async () => {
      const mockDate = "2024-02-24";
      const mockTotals = {
        productionDay: mockDate,
        items: 488,
        hats: 24,
        bibs: 24,
        miniBears: 24,
        giftBaskets: 24,
        FBA: 24,
        towels: 24,
        potHolders: 24,
        bandanas: 24,
        totalItems: 24,
        totalHours: 24,
      };
      await models.storeTotals(mockTotals, mockDate);
    });
  });
  describe("getHistoricalRange", () => {
    it("should get histortical range for mock data", async () => {
      const mockStart = "2024-02-02";
      const mockEnd = "2025-03-02";
      const results = await models.getHistoricalRange(mockStart, mockEnd);
      console.log("Data for getHistoricalRange: ");
      console.log(results);
    });
  });
  describe("queryOrdersByDate", () => {
    it("should query mock orders by date", async () => {
      const mockDate = "2024-02-02";
      const results = await models.queryOrdersByDate(mockDate);
      console.log("Data for queryOrdersByDate: ");
      console.log(results);
    });
  });
  describe("orderVolumesReport", () => {
    it("should pull mock order volumes report", async () => {
      const mockDate = ["2024-02-24"];
      const results = await models.orderVolumesReport(mockDate);
      console.log("Data for orderVolumesRepor: ");
      console.log(results);
    });
  });
  describe("getOrderIDs", () => {
    it("should pull mock order IDs", async () => {
      const startDate = "2024-02-02";
      const endDate = "2025-02-02";
      const results = await models.getOrderIDs(startDate, endDate);
      console.log("Data for getOrderIDs: ");
      console.log(results);
    });
  });
  describe("deleteData", () => {
    it("should delete mock data", async () => {
      await models.deleteData("orders");
    });
  });
} else {
  console.log(
    "NOT CONNECTED TO LOCAL DB. PLEASE CHECK process.env.MONGODB_URI"
  );
}
