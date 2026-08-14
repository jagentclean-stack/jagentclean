// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const state = vi.hoisted(() => ({
  homepage: null as null | { reviews?: Array<Record<string, never>> },
  settings: null as null | { siteName?: string | null },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        homepage: { useQuery: () => ({ data: state.homepage, isLoading: false, isError: false }) },
        siteSettings: { useQuery: () => ({ data: state.settings, isLoading: false }) },
      },
    },
  },
}));

vi.mock("@/components/AnimatedSection", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import Testimonials from "./Testimonials";

afterEach(() => {
  cleanup();
  state.homepage = null;
  state.settings = null;
});

// 公開評論路由覆蓋清單：首頁（/）由 Home.test.tsx 覆蓋；本檔覆蓋 /testimonials。
describe("Testimonials（/testimonials）", () => {
  it("沒有 CMS 已公開評論時呈現安全空白狀態，而非示例客戶評語", () => {
    render(<Testimonials />);

    expect(screen.getByTestId("reviews-empty").textContent).toContain("目前尚無公開的客戶回饋");
    expect(screen.queryByText("王先生")).toBeNull();
    expect(screen.queryByText("陳小姐")).toBeNull();
  });

  it("只從 CMS homepage 回應映射評論，元件原始碼不含示例姓名或評語", () => {
    const source = readFileSync(resolve(process.cwd(), "client/src/pages/Testimonials.tsx"), "utf8");
    expect(source).toContain("homepage.useQuery");
    expect(source).toMatch(/reviews\.map/);
    expect(source).not.toMatch(/王先生|陳小姐|服務完成後的真實回饋/);
  });
});
