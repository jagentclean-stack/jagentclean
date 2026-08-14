// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  homepage: { hero: null, services: [], reviews: [], faqs: [] } as {
    hero: null;
    services: unknown[];
    reviews: Array<{ id: number; name: string; content: string; avatar: string | null }>;
    faqs: unknown[];
  },
  settings: undefined as { siteName?: string; lineUrl?: string } | undefined,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        homepage: { useQuery: () => ({ data: state.homepage }) },
        siteSettings: { useQuery: () => ({ data: state.settings }) },
      },
    },
  },
}));

vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/AnimatedSection", () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/components/ServiceCard", () => ({ default: () => <div /> }));
vi.mock("@/components/ProcessStep", () => ({ default: () => <div /> }));
vi.mock("@/components/FAQItem", () => ({ default: () => <div /> }));
vi.mock("@/components/CTASection", () => ({ default: () => <div /> }));
vi.mock("@/components/ui/accordion", () => ({ Accordion: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/TestimonialCard", () => ({
  default: ({ name, quote }: { name: string; quote: string }) => <article data-testid="cms-review-card">{name}{quote}</article>,
}));

import Home from "./Home";

afterEach(() => {
  cleanup();
  state.homepage = { hero: null, services: [], reviews: [], faqs: [] };
  state.settings = undefined;
});

// 公開評論路由覆蓋清單：首頁（/）與客戶回饋頁（/testimonials）。
// /testimonials 的直接測試位於 Testimonials.test.tsx。
describe("首頁公開客戶回饋（/）", () => {
  it("在 CMS 沒有回傳公開評論時不渲染評論區", () => {
    render(<Home />);
    expect(screen.queryByText("客戶怎麼說")).toBeNull();
    expect(screen.queryByTestId("cms-review-card")).toBeNull();
  });

  it("僅渲染 CMS 公開資料回傳的評論項目", () => {
    state.homepage = {
      hero: null,
      services: [],
      reviews: [{ id: 1, name: "", content: "", avatar: null }],
      faqs: [],
    };
    render(<Home />);
    expect(screen.getByText("客戶怎麼說")).toBeTruthy();
    expect(screen.getAllByTestId("cms-review-card")).toHaveLength(1);
  });
});
