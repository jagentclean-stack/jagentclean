import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("公開 sitemap 交付", () => {
  const sitemap = readFileSync(resolve(import.meta.dirname, "../client/public/sitemap.xml"), "utf8");

  it("使用絕對網址列出頁面與影像資源", () => {
    expect(sitemap).toMatch(/<loc>https:\/\/jagentclean-lnbtuo7t\.manus\.space\//);
    expect(sitemap).toMatch(/<image:loc>https:\/\/jagentclean-lnbtuo7t\.manus\.space\/manus-storage\//);
    expect(sitemap).not.toMatch(/<image:loc>\//);
  });
});
