import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NavigationLink } from "./Header";

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
});
