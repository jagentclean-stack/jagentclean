import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./seoDocument", () => ({
  getSeoDocument: vi.fn(),
  getPublicCmsBootstrapState: vi.fn(),
  buildPublicCmsBootstrapScript: vi.fn(),
}));

import { isHtmlNavigationRequest, renderNavigationDocument } from "./_core/vite";
import { buildPublicCmsBootstrapScript, getPublicCmsBootstrapState, getSeoDocument } from "./seoDocument";

describe("SEO HTML document delivery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("only routes browser document navigations through the SEO renderer", () => {
    expect(isHtmlNavigationRequest({ headers: { accept: "text/html,application/xhtml+xml" } })).toBe(true);
    expect(isHtmlNavigationRequest({ headers: { accept: "application/javascript" } })).toBe(false);
    expect(isHtmlNavigationRequest({ headers: { accept: "image/webp,*/*" } })).toBe(false);
  });

  it("does not treat missing Accept headers as an HTML navigation", () => {
    expect(isHtmlNavigationRequest({})).toBe(false);
  });

  it("hydrates public homepage HTML with a whitelist-only bootstrap script", async () => {
    vi.mocked(getSeoDocument).mockResolvedValue({
      head: "<title>潔特務清潔</title>",
      content: "<main>公開首頁</main>",
      isPublicRoute: true,
      isAdminRoute: false,
    } as Awaited<ReturnType<typeof getSeoDocument>>);
    vi.mocked(getPublicCmsBootstrapState).mockResolvedValue({
      siteSettings: { company_name: "潔特務清潔", line_url: "https://lin.ee/ynvoHjh" },
      navigation: [{ label: "首頁", href: "/" }],
    } as Awaited<ReturnType<typeof getPublicCmsBootstrapState>>);
    vi.mocked(buildPublicCmsBootstrapScript).mockReturnValue(
      '<script id="public-cms-bootstrap">window.__PUBLIC_CMS_BOOTSTRAP__={"siteSettings":{"company_name":"潔特務清潔"}}</script>'
    );

    const document = await renderNavigationDocument(
      "<html><head><!--ssr-head--></head><body><!--ssr-content--></body></html>",
      "/",
      "https://jagentclean.example"
    );

    expect(document.status).toBe(200);
    expect(document.html).toContain('id="public-cms-bootstrap"');
    expect(document.html).toContain("潔特務清潔");
    expect(document.html).not.toContain("CMS_ADMIN_PASSWORD");
    expect(document.html).not.toContain("payroll");
    expect(document.html).not.toContain("salary");
  });
});
