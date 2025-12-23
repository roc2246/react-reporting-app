import { describe, it, expect, vi } from "vitest";
import Excel from "exceljs";
import { PassThrough } from "stream";
import * as reports from "../report.js";
import * as models from "../../models/index.js";
import * as utilities from "../../utilities/index.js";

vi.mock("../../models/index.js", () => ({
  getHistoricalRange: vi.fn(),
}));
vi.mock("../../utilities/index.js", () => ({
  itemsPerHour: vi.fn(),
}));

describe("Report Controllers", () => {
  it("downloadRangeSummary generates Excel file", async () => {
    const dailyTotals = [
      { items: 5, hats: 2, totalHours: 1 },
      { items: 3, hats: 1, totalHours: 2 },
    ];
    models.getHistoricalRange.mockResolvedValue(dailyTotals);
    utilities.itemsPerHour.mockReturnValue(2);

    // Create a PassThrough stream to simulate res
    const stream = new PassThrough();
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));

    const mockRes = {
      setHeader: vi.fn(),
      write: stream.write.bind(stream),
      end: stream.end.bind(stream),
    };

    await reports.downloadRangeSummary({}, mockRes, "2025-12-20", "2025-12-21");

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(mockRes.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      "attachment; filename=output.xlsx"
    );

    // Make sure something was written to the stream
    expect(chunks.length).toBeGreaterThan(0);
  });
});
