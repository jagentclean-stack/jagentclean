import { describe, expect, it } from "vitest";
import { isHtmlNavigationRequest } from "./_core/vite";

describe("SEO HTML document delivery", () => {
  it("only routes browser document navigations through the SEO renderer", () => {
    expect(isHtmlNavigationRequest({ headers: { accept: "text/html,application/xhtml+xml" } })).toBe(true);
    expect(isHtmlNavigationRequest({ headers: { accept: "application/javascript" } })).toBe(false);
    expect(isHtmlNavigationRequest({ headers: { accept: "image/webp,*/*" } })).toBe(false);
  });

  it("does not treat missing Accept headers as an HTML navigation", () => {
    expect(isHtmlNavigationRequest({})).toBe(false);
  });
});
