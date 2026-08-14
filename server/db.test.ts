import { describe, expect, it } from "vitest";
import { getApplicationDatabaseUrl } from "./db";

describe("getApplicationDatabaseUrl", () => {
  it("restores the project ID casing when the URL database name differs only by case", () => {
    const normalized = getApplicationDatabaseUrl(
      "mysql://user:password@example.com:4000/lnbtuo7ttwcvjt8adwcnja",
      "LnbTuo7TTWCvjT8aDWCnJa",
    );

    expect(normalized).toContain("/LnbTuo7TTWCvjT8aDWCnJa");
  });

  it("does not rewrite a URL when the database name is unrelated", () => {
    const url = "mysql://user:password@example.com:4000/another_database";

    expect(getApplicationDatabaseUrl(url, "LnbTuo7TTWCvjT8aDWCnJa")).toBe(url);
  });
});
