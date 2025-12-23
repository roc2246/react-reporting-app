import { describe, it, expect } from "vitest";
import { generateRandomString } from "../random.js";

describe("random utilities", () => {
  it("generateRandomString returns a string of correct length", () => {
    const result = generateRandomString(10);
    expect(result).toHaveLength(10);
  });

  it("generateRandomString returns hex characters", () => {
    const result = generateRandomString(16);
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});
