import { describe, it, expect, vi, beforeEach } from "vitest";
import https from "https";
import * as shipstation from "../shipstation.js";
import * as models from "../../models/index.js";
import * as utilities from "../../utilities/index.js";

vi.mock("https");

describe("ShipStation Controllers", () => {
  let res;

  beforeEach(() => {
    vi.restoreAllMocks();
    res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  function mockHttpsResponse(data) {
    const on = vi.fn();
    const end = vi.fn();

    const request = vi.fn(() => ({
      on: vi.fn(),
      end,
    }));

    https.request.mockImplementation((options, callback) => {
      callback({
        on: (event, cb) => {
          if (event === "data") cb(JSON.stringify(data));
          if (event === "end") cb();
        },
      });
      return {
        on: vi.fn(),
        end: vi.fn(),
      };
    });

    return { request, on, end };
  }

  it("archiveOrders calls res.json with orders", async () => {
    const orders = [{ orderNumber: "123" }];
    mockHttpsResponse(orders);

    await shipstation.archiveOrders({}, res, 1);

    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it("awaitingShipment calls res.json with orders", async () => {
    const orders = [{ orderNumber: "456" }];
    mockHttpsResponse(orders);

    await shipstation.awaitingShipment({}, res, 1);

    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it("recoverData calls res.json with orders", async () => {
    const orders = [{ orderNumber: "789" }];
    const date = "2025-12-22";
    mockHttpsResponse(orders);

    await shipstation.recoverData({}, res, 1, date);

    expect(res.json).toHaveBeenCalledWith(orders);
  });

  it("manageArchives calls shipments and filter correctly", async () => {
    const firstPage = { orders: [{ orderId: "a" }], total: 2, pages: 2 };
    const secondPage = { orders: [{ orderId: "b" }] };

    const shipments = vi
      .fn()
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);
    const filter = vi.fn();

    await shipstation.manageArchives(shipments, filter);

    expect(shipments).toHaveBeenCalledTimes(2);
    expect(shipments).toHaveBeenCalledWith(1);
    expect(shipments).toHaveBeenCalledWith(2);
    expect(filter).toHaveBeenCalledWith([...firstPage.orders, ...secondPage.orders]);
  });
});
