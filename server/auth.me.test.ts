import { describe, expect, it } from "vitest";
import { serializePublicUser } from "./routers";

describe("auth.me public user serialization", () => {
  it("only returns explicitly allowed session fields", () => {
    const result = serializePublicUser({
      id: 7,
      openId: "employee-7",
      name: "員工",
      email: "employee@example.com",
      loginMethod: "cms_password",
      passwordHash: "scrypt$secret",
      role: "editor",
      isActive: true,
      createdAt: new Date("2026-08-14T00:00:00Z"),
      updatedAt: new Date("2026-08-14T00:00:00Z"),
      lastSignedIn: null,
      internalOnly: "do-not-send",
    } as never);

    expect(result).toEqual(expect.objectContaining({ id: 7, email: "employee@example.com", role: "editor", isActive: true }));
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("internalOnly");
  });

  it("returns null when no authenticated user exists", () => {
    expect(serializePublicUser(null)).toBeNull();
  });
});
