// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

type SiteSettings = {
  siteName?: string | null;
  siteDescription?: string | null;
  logoUrl?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyAddress?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
  copyrightText?: string | null;
};

const state = vi.hoisted(() => ({
  siteSettings: undefined as SiteSettings | undefined,
  footer: undefined as undefined | { aboutText?: string; quickLinks?: unknown; copyrightText?: string },
}));

const legacyValues = ["潔特務清潔", "06-3584567", "jagentclean@gmail.com", "台南市安南區國安街45巷12號", "https://lin.ee/ynvoHjh"];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        siteSettings: { useQuery: () => ({ data: state.siteSettings, isLoading: false }) },
        menus: { useQuery: () => ({ data: [] }) },
        footer: { useQuery: () => ({ data: state.footer }) },
        seo: { useQuery: () => ({ data: null }) },
        faqs: { useQuery: () => ({ data: [] }) },
      },
    },
  },
}));

vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));

vi.mock("./ThemeToggleButton", () => ({ default: () => <button type="button">切換主題</button> }));

import FloatingContactMenu from "./FloatingContactMenu";
import Footer from "./Footer";
import Header from "./Header";
import SEOHead from "./SEOHead";

afterEach(() => {
  cleanup();
  state.siteSettings = undefined;
  state.footer = undefined;
  document.head.innerHTML = "";
  document.title = "";
});

describe("公開設定元件", () => {
  it("Header 在沒有設定時不輸出品牌或 Logo 備援；設定存在時只輸出 CMS 品牌", () => {
    const first = render(<Header />);
    expect(first.container.textContent).not.toContain("資料庫品牌");
    expect(first.container.querySelector("img")).toBeNull();
    legacyValues.forEach((value) => expect(first.container.textContent).not.toContain(value));
    first.unmount();

    state.siteSettings = { siteName: "資料庫品牌", logoUrl: "/cms-logo.webp" };
    render(<Header />);
    expect(screen.getByText("資料庫品牌")).toBeTruthy();
    expect(screen.getByAltText("資料庫品牌 Logo").getAttribute("src")).toBe("/cms-logo.webp");
  });

  it("Footer 在沒有設定時不輸出聯繫備援；設定存在時只輸出 CMS 聯繫資料", () => {
    const first = render(<Footer />);
    expect(first.container.textContent).not.toContain("資料庫電話");
    expect(first.container.textContent).not.toContain("資料庫信箱");
    legacyValues.forEach((value) => expect(first.container.textContent).not.toContain(value));
    first.unmount();

    state.siteSettings = {
      siteName: "資料庫品牌",
      companyPhone: "資料庫電話",
      companyEmail: "資料庫信箱",
      companyAddress: "資料庫地址",
      lineUrl: "https://example.test/line",
      facebookUrl: "https://example.test/facebook",
      copyrightText: "資料庫版權",
    };
    render(<Footer />);
    expect(screen.getByText("資料庫電話")).toBeTruthy();
    expect(screen.getByText("資料庫信箱")).toBeTruthy();
    expect(screen.getByText(/資料庫地址/)).toBeTruthy();
    expect(screen.getByText("資料庫版權")).toBeTruthy();
  });

  it("FloatingContactMenu 在沒有設定時不渲染，設定存在時只建立 CMS 設定的連結", () => {
    const first = render(<FloatingContactMenu />);
    expect(first.container.querySelector("nav")).toBeNull();
    legacyValues.forEach((value) => expect(first.container.textContent).not.toContain(value));
    first.unmount();

    state.siteSettings = { lineUrl: "https://example.test/line", companyPhone: "資料庫電話", companyEmail: "資料庫信箱" };
    render(<FloatingContactMenu />);
    expect(screen.getByLabelText("快速聯絡方式")).toBeTruthy();
    expect(screen.getByRole("link", { name: /資料庫電話/ }).getAttribute("href")).toBe("tel:");
    expect(screen.getByRole("link", { name: /電子郵件/ }).getAttribute("href")).toBe("mailto:資料庫信箱");
  });

  it("SEOHead 在沒有設定時不回退至品牌文案；設定存在時採用 CMS 品牌與描述", () => {
    render(<SEOHead pathname="/" />);
    expect(document.title).toBe("首頁");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("");
    legacyValues.forEach((value) => expect(document.head.textContent).not.toContain(value));
    cleanup();

    state.siteSettings = { siteName: "資料庫品牌", siteDescription: "資料庫描述" };
    render(<SEOHead pathname="/" />);
    expect(document.title).toBe("首頁｜資料庫品牌");
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute("content")).toBe("資料庫描述");
  });
});
