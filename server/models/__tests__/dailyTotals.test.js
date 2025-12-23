import { describe, it, expect, vi } from "vitest";
import * as dailyTotals from "../../models/dailyTotals.js";
import * as db from "../../models/db.js";

// Mock DB
vi.mock("../../models/db.js", () => ({
  connectToDB: vi.fn().mockResolvedValue({
    db: {
      collection: () => ({
        findOne: vi.fn().mockResolvedValue({ totalHours: 5, items: 10, FBA: 2 }),
        updateOne: vi.fn(),
        insertOne: vi.fn(),
        find: () => ({ sort: () => ({ toArray: () => [{ totalHours: 5, totalItems: 10 }] }) }),
      }),
    },
  }),
}));

describe("DailyTotals Model", () => {
  it("getTotalHours should return total hours", async () => {
    const hours = await dailyTotals.getTotalHours();
    expect(hours).toBe(5);
  });

  it("getFBANo should return FBA number", async () => {
    const fba = await dailyTotals.getFBANo();
    expect(fba).toBe(2);
  });
});
