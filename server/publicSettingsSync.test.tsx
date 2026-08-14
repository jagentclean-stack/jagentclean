import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Header from "../client/src/components/Header";
import Footer from "../client/src/components/Footer";
import FloatingContactMenu from "../client/src/components/FloatingContactMenu";
import { ThemeProvider } from "../client/src/contexts/ThemeContext";

const settings = {
  siteName: "設定中的品牌名稱",
  siteDescription: "由 CMS Settings 管理的網站描述",
  logoUrl: "/manus-storage/settings-logo.png",
  companyPhone: "0800-123-456",
  companyEmail: "service@example.test",
  companyAddress: "設定中的公司地址",
  lineUrl: "https://example.test/line",
  facebookUrl: "https://example.test/facebook",
  copyrightText: "© 設定中的版權資訊",
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        menus: { useQuery: () => ({ data: [] }) },
        siteSettings: { useQuery: () => ({ data: settings }) },
        footer: { useQuery: () => ({ data: { aboutText: "頁尾介紹", quickLinks: [], copyrightText: "舊版版權" } }) },
      },
    },
  },
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children),
}));

describe("公開 CMS Settings 同步", () => {
  it("導覽列、頁尾與浮動聯繫均使用安全公開設定，而非舊有硬編碼資料", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider>
        <Header />
        <Footer />
        <FloatingContactMenu />
      </ThemeProvider>,
    );

    expect(html).toContain(settings.siteName);
    expect(html).toContain(settings.logoUrl);
    expect(html).toContain(settings.companyPhone);
    expect(html).toContain(settings.companyEmail);
    expect(html).toContain(settings.companyAddress);
    expect(html).toContain(settings.lineUrl);
    expect(html).toContain(settings.facebookUrl);
    expect(html).toContain(settings.copyrightText);
    expect(html).not.toContain("06-3584567");
    expect(html).not.toContain("jagentclean@gmail.com");
  });
});
