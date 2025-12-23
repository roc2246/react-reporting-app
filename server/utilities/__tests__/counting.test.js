import { describe, it, expect, vi } from "vitest";
import * as counting from "../counting.js";

describe("counting utilities", () => {
  it("itemsPerHour returns 0 if hours is 0", () => {
    expect(counting.itemsPerHour(10, 0)).toBe(0);
  });

  it("itemsPerHour calculates correctly", () => {
    expect(counting.itemsPerHour(50, 4)).toBe("12.5");
  });

  it("getCount returns an object with totalItems and itemsPerHour", () => {
    const docs = [
      { items: [{ quantity: 2 }], customerNotes: "(2) hat" },
      { items: [{ quantity: 3 }], customerNotes: "(3) bib" }
    ];
    const result = counting.getCount(docs, "2025-12-23");
    expect(result).toHaveProperty("totalItems");
    expect(result).toHaveProperty("itemsPerHour");
  });

  it("morningCounts returns a string summary", async () => {
    const fakeShipments = async (page) => ({
      orders: [
        { billTo: { name: "Test" }, customerNotes: "(1) hat" }
      ],
      total: 1,
      pages: 1
    });
    const result = await counting.morningCounts(fakeShipments);
    expect(result).toContain("Total Collars");
  });
});
