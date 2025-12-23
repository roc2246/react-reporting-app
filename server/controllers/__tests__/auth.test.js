import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "../auth.js";

// Proper default import mock for bcrypt
import bcrypt from "bcrypt";

vi.mock("bcrypt", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    __esModule: true, // important for default export
    default: {
      ...actual,
      hash: vi.fn(),
      compare: vi.fn(),
    },
  };
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("Auth Controllers", () => {
  it("hashString returns hashed value", async () => {
    bcrypt.hash.mockResolvedValue("hashedValue"); // now works
    const hashed = await auth.hashString("password");
    expect(hashed).toBe("hashedValue");
  });

  it("login fails with invalid user", async () => {
    const models = await import("../../models/index.js");
    vi.spyOn(models, "findUser").mockResolvedValue(null);

    const req = { body: { username: "wrong", password: "pass" } };
    const res = { status: vi.fn().mockReturnThis(), send: vi.fn() };

    await auth.login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith("Invalid credentials");
  });

  it("logout destroys session", () => {
    const destroy = vi.fn((cb) => cb(null));
    const req = { session: { destroy } };
    const res = { redirect: vi.fn() };

    auth.logout(req, res);
    expect(destroy).toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith("/login");
  });
});
