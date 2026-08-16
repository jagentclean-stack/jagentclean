import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getPublishedBlogBySlug: vi.fn(async () => undefined),
  getSEOBySlug: vi.fn(async () => undefined),
  getVisibleFAQs: vi.fn(async () => []),
  getSettingsByKeys: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);

import { getSeoDocument } from "./seoDocument";

describe("文章詳情伺服器端 SEO", () => {
  it("首次開啟已發布文章時即輸出可索引的 Article 中繼資料與摘要", async () => {
    dbMock.getPublishedBlogBySlug.mockResolvedValueOnce({
      title: "床墊需要清洗嗎？",
      slug: "does-a-mattress-need-cleaning",
      excerpt: "床墊深層清潔與保養建議。",
      featuredImage: "/manus-storage/mattress.webp",
      publishedAt: new Date("2026-08-16T00:00:00.000Z"),
      updatedAt: new Date("2026-08-16T00:00:00.000Z"),
      seoTitle: null,
      seoDescription: null,
      seoKeywords: "床墊清潔",
    });

    const document = await getSeoDocument("https://example.com/blog/does-a-mattress-need-cleaning", "https://example.com");

    expect(document.isPublicRoute).toBe(true);
    expect(document.head).toContain('property="og:type" content="article"');
    expect(document.head).toContain('"@type":"Article"');
    expect(document.content).toContain("床墊需要清洗嗎？");
  });

  it("未發布或不存在的文章詳情不會被標示為公開可索引路由", async () => {
    dbMock.getPublishedBlogBySlug.mockResolvedValueOnce(undefined);

    const document = await getSeoDocument("https://example.com/blog/private-draft", "https://example.com");

    expect(document.isPublicRoute).toBe(false);
    expect(document.head).toContain('content="noindex, nofollow"');
    expect(document.content).toBe("");
  });
});
