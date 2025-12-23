import { describe, it, expect, vi } from "vitest";
import * as orderQue from "../../models/orderQue.js";
import * as db from "../../models/db.js";

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ total: 10 }) })
);

// Mock DB
vi.mock("../../models/db.js", () => ({
  connectToDB: vi.fn().mockResolvedValue({
    db: {
      collection: () => ({
        distinct: vi.fn().mockResolvedValue(["2025-01-01"]),
        find: vi.fn().mockReturnValue({ toArray: () => [] }),
        insertOne: vi.fn(),
        updateOne: vi.fn(),
      }),
    },
  }),
}));

describe("OrderQue Model", () => {
  it("pullQueDays should return array of days", async () => {
    const days = await orderQue.pullQueDays();
    expect(days).toEqual(["2025-01-01"]);
  });

  it("addQueTotal should update que total", async () => {
    await orderQue.addQueTotal("fiveAM");
    expect(global.fetch).toHaveBeenCalled();
  });
});
