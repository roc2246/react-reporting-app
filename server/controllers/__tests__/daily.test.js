import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as daily from "../daily.js";
import * as models from "../../models/index.js";
import * as utilities from "../../utilities/index.js";

// Mock response object for Express
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Daily Controllers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("dataOfDay", () => {
    it("returns count of orders for today", async () => {
      const orders = [{ id: 1 }, { id: 2 }];
      const countValue = 2;

      vi.spyOn(utilities, "getProductionDay").mockReturnValue({ today: "2025-12-22" });
      vi.spyOn(models, "queryOrdersByDate").mockResolvedValue(orders);
      vi.spyOn(utilities, "getCount").mockReturnValue(countValue);

      const res = mockRes();
      await daily.dataOfDay({}, res);

      expect(models.queryOrdersByDate).toHaveBeenCalledWith("2025-12-22");
      expect(res.json).toHaveBeenCalledWith(countValue);
    });

    it("handles errors", async () => {
      vi.spyOn(utilities, "getProductionDay").mockReturnValue({ today: "2025-12-22" });
      vi.spyOn(models, "queryOrdersByDate").mockRejectedValue(new Error("DB error"));

      const res = mockRes();
      await daily.dataOfDay({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });
  });

  describe("manageDailyTotals", () => {
    it("stores totals with correct data", async () => {
      vi.spyOn(models, "getTotalHours").mockResolvedValue(10);
      vi.spyOn(models, "getFBANo").mockResolvedValue(5);
      vi.spyOn(models, "storeTotals").mockImplementation(() => {});

      vi.spyOn(utilities, "getProductionDay").mockReturnValue({ today: "2025-12-22" });

      const data = {};
      await daily.manageDailyTotals(data);

      expect(data.totalHours).toBe(10);
      expect(data.FBA).toBe(5);
      expect(models.storeTotals).toHaveBeenCalledWith(data, "2025-12-22");
    });
  });

  describe("getProductionDates", () => {
    it("returns production days", async () => {
      const productionDays = ["2025-12-20", "2025-12-21"];
      vi.spyOn(models, "pullProductionDays").mockResolvedValue(productionDays);

      const res = mockRes();
      await daily.getProductionDates({}, res);

      expect(res.json).toHaveBeenCalledWith(productionDays);
    });

    it("handles errors", async () => {
      vi.spyOn(models, "pullProductionDays").mockRejectedValue(new Error("DB error"));

      const res = mockRes();
      await daily.getProductionDates({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });
  });

  describe("getQueDates", () => {
    it("returns queue days", async () => {
      const queDays = ["2025-12-18", "2025-12-19"];
      vi.spyOn(models, "pullQueDays").mockResolvedValue(queDays);

      const res = mockRes();
      await daily.getQueDates({}, res);

      expect(res.json).toHaveBeenCalledWith(queDays);
    });

    it("handles errors", async () => {
      vi.spyOn(models, "pullQueDays").mockRejectedValue(new Error("DB error"));

      const res = mockRes();
      await daily.getQueDates({}, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });
  });
});
