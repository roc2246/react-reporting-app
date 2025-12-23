import { describe, it, expect } from "vitest";
import * as dates from "../dates.js";

describe("dates utilities", () => {
  it("getModifyTime returns a string in YYYY-MM-DD format", () => {
    const result = dates.getModifyTime("2025-12-23T00:00:00Z");
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it("getEastCoastTime returns a string containing AM or PM", () => {
    const result = dates.getEastCoastTime();
    expect(result).toMatch(/AM|PM/);
  });

  it("parseTime correctly parses PM time", () => {
    const date = dates.parseTime("2:30 PM");
    expect(date.getHours()).toBe(14);
    expect(date.getMinutes()).toBe(30);
  });

  it("getProductionDay returns today, tomorrow, and thirtyOneDaysAgo", () => {
    const result = dates.getProductionDay();
    expect(result).toHaveProperty("today");
    expect(result).toHaveProperty("tomorrow");
    expect(result).toHaveProperty("thirtyOneDaysAgo");
  });

  it("isLeapYear correctly identifies leap years", () => {
    expect(dates.isLeapYear(2024)).toBe(true);
    expect(dates.isLeapYear(2025)).toBe(false);
  });

  it("getWeekSpan returns an array of 7 dates", () => {
    const result = dates.getWeekSpan();
    expect(result).toHaveLength(7);
  });
});
