import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Header, { NavigationLink } from "./Header";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        menus: { useQuery: () => ({ data: [] }) },
        siteSettings: {
          useQuery: () => ({
            data: {
              siteName: "潔特務清潔",
              logoUrl: "/manus-storage/jagent-cleaning-logo-transparent_fc1d6840.png",
            },
          }),
        },
      },
    },
  },
}));

vi.mock("./ThemeToggleButton", () => ({ default: () => null }));
vi.mock("wouter", () => ({
  Link: ({ href, children, ...props }: { href: string; children: unknown }) => createElement("a", { href, ...props }, children),
}));

const baseItem = {
  id: 1,
  label: "服務項目",
  url: "/services",
  openNewWindow: true,
  children: [],
};

describe("Header CMS 導覽連結", () => {
  it("讓設定為新視窗的內部連結輸出安全 target 與 rel 屬性", () => {
    const markup = renderToStaticMarkup(createElement(NavigationLink, { item: baseItem, className: "nav-link" }));
    expect(markup).toContain('href="/services"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("讓設定為新視窗的外部連結輸出安全 target 與 rel 屬性", () => {
    const item = { ...baseItem, id: 2, label: "Facebook", url: "https://www.facebook.com/Jagentclean" };
    const markup = renderToStaticMarkup(createElement(NavigationLink, { item, className: "nav-link" }));
    expect(markup).toContain('href="https://www.facebook.com/Jagentclean"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
  });

  it("以完整比例顯示新版透明底 Logo，且不重複輸出網站名稱", () => {
    const markup = renderToStaticMarkup(createElement(Header));

    expect(markup).toContain('src="/manus-storage/jagent-cleaning-logo-transparent_fc1d6840.png"');
    expect(markup).toContain('class="flex h-16 w-24 items-center justify-center sm:w-28"');
    expect(markup).toContain('class="h-full w-full object-contain"');
    expect(markup).not.toContain('class="hidden flex-col sm:flex"');
  });
});
