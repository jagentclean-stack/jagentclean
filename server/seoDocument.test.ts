import { describe, expect, it } from "vitest";
import { buildSeoHead, getPublicPathname, getSeoSlug } from "./seoDocument";

describe("伺服器端 SEO 文件組裝", () => {
  it("為公開頁產生頁面專屬 canonical、社群標記與麵包屑結構化資料", () => {
    const head = buildSeoHead({ origin: "https://example.com", pathname: "/faq", seo: { title: "FAQ < 安全", description: "回答 <script>", canonical: "/faq" }, faqs: [{ question: "如何預約？", answer: "透過 LINE。" }] });
    expect(head).toContain('rel="canonical" href="https://example.com/faq"');
    expect(head).toContain("FAQ &lt; 安全");
    expect(head).toContain("FAQPage");
    expect(head).toContain("BreadcrumbList");
    expect(head).toContain('"name":"常見問題"');
    expect(head).not.toContain("<script>");
  });

  it("只在首頁輸出具有真實公司資訊的 LocalBusiness 結構化資料", () => {
    const homeHead = buildSeoHead({ origin: "https://example.com", pathname: "/" });
    const servicesHead = buildSeoHead({ origin: "https://example.com", pathname: "/services" });
    expect(homeHead).toContain('"@type":"LocalBusiness"');
    expect(homeHead).toContain('"telephone":"06-3584567"');
    expect(servicesHead).not.toContain('"@type":"LocalBusiness"');
  });

  it("只注入符合格式的 GA4 與 Meta Pixel 追蹤碼", () => {
    const head = buildSeoHead({ origin: "https://example.com", pathname: "/", gaId: "G-ABC12345", metaPixelId: "1234567890" });
    const unsafeHead = buildSeoHead({ origin: "https://example.com", pathname: "/", gaId: "<script>", metaPixelId: "abc" });
    expect(head).toContain("googletagmanager.com/gtag/js?id=G-ABC12345");
    expect(head).toContain("fbq('init','1234567890')");
    expect(unsafeHead).not.toContain("googletagmanager.com/gtag/js");
    expect(unsafeHead).not.toContain("fbq('init'");
  });

  it("正確正規化路徑並轉換為 CMS SEO slug", () => {
    expect(getPublicPathname("/cases/?source=test")).toBe("/cases");
    expect(getSeoSlug("/")).toBe("home");
    expect(getSeoSlug("/services")).toBe("services");
  });
});
