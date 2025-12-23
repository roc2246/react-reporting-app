import { describe, it, expect, vi } from "vitest";
import * as orders from "../../models/orders.js";
import * as db from "../../models/db.js";

// Mock DB
vi.mock("../../models/db.js", () => ({
  connectToDB: vi.fn().mockResolvedValue({
    db: {
      collection: () => ({
        insertMany: vi.fn().mockResolvedValue({ insertedCount: 2 }),
        find: () => ({ project: () => ({ stream: () => ({ on: (evt, cb) => evt === "end" ? cb() : null }) }) }),
        updateOne: vi.fn(),
        distinct: vi.fn().mockResolvedValue([1, 2, 3]),
      }),
    },
  }),
}));

describe("Orders Model", () => {
  it("newArchive should insert orders", async () => {
    const result = await orders.newArchive([{ orderId: 1 }, { orderId: 2 }]);
    expect(result).toBeUndefined(); // logs success, no return
  });

  it("getOrderIDs should return distinct orderIds", async () => {
    const ids = await orders.getOrderIDs("2025-01-01", "2025-01-02");
    expect(ids).toEqual([1, 2, 3]);
  });
});
