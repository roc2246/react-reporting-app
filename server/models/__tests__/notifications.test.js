import { describe, it, expect, vi } from "vitest";
import * as notifications from "../../models/notifications.js";
import * as db from "../../models/db.js";

// Mock DB
vi.mock("../../models/db.js", () => ({
  connectToDB: vi.fn().mockResolvedValue({
    db: {
      collection: () => ({
        insertMany: vi.fn().mockResolvedValue({ insertedCount: 1 }),
        find: () => ({ project: () => ({ toArray: () => [{ orderId: 1 }] }) }),
      }),
    },
  }),
}));

describe("Notifications Model", () => {
  it("newNotification should insert notifications", async () => {
    const result = await notifications.newNotification([{ orderId: 1 }]);
    expect(result).toBeUndefined();
  });

  it("shipIdsByDate should return array of orderIds", async () => {
    const ids = await notifications.shipIdsByDate("2025-01-01");
    expect(ids).toEqual([{ orderId: 1 }]);
  });
});
