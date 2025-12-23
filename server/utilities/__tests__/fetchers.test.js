import { describe, it, expect, vi } from "vitest";
import * as fetchers from "../fetchers.js";

global.fetch = vi.fn();

describe("fetchers utilities", () => {
  it("fetchAwaiting returns parsed JSON", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ test: 123 })
    });
    const result = await fetchers.fetchAwaiting(1);
    expect(result).toEqual({ test: 123 });
  });

  it("fetchShipped throws error if response not ok", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchers.fetchShipped(1)).rejects.toThrow("HTTP error! status: 500");
  });
});
