import { describe, it, expect, vi } from "vitest";

// Correctly mock multer for ESM default import
vi.mock("multer", () => {
  const multerMockSingle = vi.fn();
  const multerMock = vi.fn(() => ({ single: multerMockSingle }));
  multerMock.memoryStorage = vi.fn(() => "memoryStorageMock");
  return { default: multerMock }; // <- must wrap in `default`
});

// Mock firebase-admin
vi.mock("firebase-admin", () => {
  const fileMock = {
    createWriteStream: () => ({
      on: (event, cb) => { if (event === "finish") cb(); },
      end: vi.fn(),
    }),
  };
  const bucketMock = {
    file: vi.fn(() => fileMock),
    getFiles: vi.fn(() => [[]]),
  };
  return {
    default: {
      storage: () => ({ bucket: () => bucketMock }),
    },
  };
});

// Import after mocks
import * as fileUpload from "../fileUpload.js";

describe("fileUpload utilities", () => {
  it("setMulterStorage returns a function", () => {
    const result = typeof fileUpload.setMulterStorage
    expect(result).toBe("function"); // should now pass
  });

  it("deleteFiles resolves without error", async () => {
    await expect(fileUpload.deleteFiles()).resolves.not.toThrow();
  });
});
