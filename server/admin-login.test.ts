import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getUserByEmail: vi.fn(async () => undefined),
  upsertUser: vi.fn(async () => undefined),
  getUserByOpenId: vi.fn(async () => ({
    openId: "cms-admin:jagentclean@gmail.com",
    email: "jagentclean@gmail.com",
    name: "潔特務管理員",
    role: "admin",
  })),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn(async () => "test-session-token") },
}));

vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn(() => ({ httpOnly: true, sameSite: "lax" })),
}));

import { registerAdminLoginRoutes } from "./admin-login";

describe("CMS administrator login", () => {
  const app = express();
  let server: ReturnType<typeof app.listen>;
  let baseUrl = "";

  beforeAll(async () => {
    app.use(express.json());
    registerAdminLoginRoutes(app);
    await new Promise<void>(resolve => {
      server = app.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (!address || typeof address === "string") throw new Error("Test server did not start");
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(() => server.close());

  it("accepts an approved email with the configured CMS password", async () => {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jagentclean@gmail.com",
        password: process.env.CMS_ADMIN_PASSWORD,
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true });
    expect(response.headers.get("set-cookie")).toContain("test-session-token");
  });

  it("rejects a password that does not match the configured secret", async () => {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "jagentclean@gmail.com",
        password: "incorrect-password",
      }),
    });

    expect(response.status).toBe(401);
  });
});
