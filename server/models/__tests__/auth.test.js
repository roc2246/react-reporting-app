import { describe, it, expect, vi } from "vitest";
import * as auth from "../../models/auth.js";
import * as db from "../../models/db.js";

// Mock DB connection
vi.mock("../../models/db.js", () => ({
  connectToDB: vi.fn().mockResolvedValue({
    db: {
      collection: () => ({
        findOne: ({ username }) => Promise.resolve({ username, password: "hashed" }),
      }),
    },
  }),
}));

describe("Auth Model", () => {
  it("findUser should return a user object", async () => {
    const user = await auth.findUser("testUser");
    expect(user).toHaveProperty("username", "testUser");
  });
});
