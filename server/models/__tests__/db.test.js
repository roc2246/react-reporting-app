import { describe, it, expect, vi } from "vitest";
import * as dbModule from "../../models/db.js";

// Properly mock MongoClient as a class
const mockConnect = vi.fn();
const mockDb = vi.fn().mockReturnValue({});

vi.mock("mongodb", () => {
  return {
    MongoClient: class {
      constructor() {
        this.connect = mockConnect;
        this.db = mockDb;
      }
    },
  };
});

describe("DB Connection", () => {
  it("should connect to MongoDB and return db and client", async () => {
    const { db, client } = await dbModule.connectToDB();
    expect(db).toBeDefined();
    expect(client).toBeDefined();
    expect(mockConnect).toHaveBeenCalled(); // Ensure connect was called
    expect(mockDb).toHaveBeenCalled();      // Ensure db() was called
  });
});
