import { describe, expect, it } from "vitest";
import { buildBreadcrumbSchema, buildFaqSchema, safeCanonical, seoSlugFromPath } from "./seo";

describe("SEO 工具", () => {
  it("將公開路徑轉換為一致的 CMS SEO slug", () => {
    expect(seoSlugFromPath("/")).toBe("home");
    expect(seoSlugFromPath("/services/")).toBe("services");
  });

  it("僅接受可用的 HTTP(S) canonical URL", () => {
    expect(safeCanonical("https://example.com/page", "https://fallback.test/")).toBe("https://example.com/page");
    expect(safeCanonical("javascript:alert(1)", "https://fallback.test/")).toBe("https://fallback.test/");
  });

  it("為公開頁建立可讀的 Breadcrumb 與 FAQ 結構化資料", () => {
    const breadcrumb = buildBreadcrumbSchema("https://example.com", "/faq");
    expect(breadcrumb?.itemListElement).toHaveLength(2);
    expect(breadcrumb?.itemListElement[1].name).toBe("常見問題");

    const faq = buildFaqSchema([{ question: "如何諮詢？", answer: "請加入官方 LINE。" }]);
    expect(faq?.mainEntity[0].acceptedAnswer.text).toBe("請加入官方 LINE。");
  });
});
