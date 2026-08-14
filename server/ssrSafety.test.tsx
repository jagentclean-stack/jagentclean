// @vitest-environment node
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import FloatingButtons from "../client/src/components/FloatingButtons";
import Header from "../client/src/components/Header";
import Footer from "../client/src/components/Footer";
import SEOHead from "../client/src/components/SEOHead";
import { ThemeProvider } from "../client/src/contexts/ThemeContext";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        menus: { useQuery: () => ({ data: [{ id: 1, label: "服務項目", url: "/services", openNewWindow: false, children: [] }] }) },
        siteSettings: { useQuery: () => ({ data: { siteName: "J-Agent Cleaning", logoUrl: null } }) },
        footer: { useQuery: () => ({ data: { aboutText: "專業清潔服務", quickLinks: [], socialLinks: {}, copyrightText: "© J-Agent" } }) },
        seo: { useQuery: () => ({ data: null }) },
        faqs: { useQuery: () => ({ data: [] }) },
      },
    },
  },
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => React.createElement("a", { href, ...props }, children),
}));

describe("公開元件 SSR 安全性", () => {
  it("在沒有 window、document 與 localStorage 的 Node 環境中可渲染浮動操作按鈕", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(typeof globalThis.document).toBe("undefined");
    expect(() => renderToStaticMarkup(<FloatingButtons />)).not.toThrow();
  });

  it("在沒有 window、document 與 localStorage 的 Node 環境中可渲染公開頁殼層", () => {
    expect(() => renderToStaticMarkup(
      <ThemeProvider>
        <Header />
        <SEOHead pathname="/faq" />
        <Footer />
      </ThemeProvider>
    )).not.toThrow();
  });
});
