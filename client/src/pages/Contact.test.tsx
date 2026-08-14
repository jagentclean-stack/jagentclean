// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  settings: null as null | {
    siteName?: string | null;
    lineUrl?: string | null;
    companyPhone?: string | null;
    companyEmail?: string | null;
    companyAddress?: string | null;
    companyFax?: string | null;
    lineId?: string | null;
    contactImageUrl?: string | null;
  },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      publicContent: {
        siteSettings: { useQuery: () => ({ data: testState.settings, isLoading: false }) },
      },
    },
  },
}));

import Contact from "./Contact";

afterEach(() => {
  cleanup();
  testState.settings = null;
});

describe("Contact image fallback", () => {
  it("未設定形象圖片時顯示品牌替代內容而非空白圖片欄位", () => {
    render(<Contact />);
    expect(screen.queryByAltText("專業服務團隊")).toBeNull();
    expect(screen.getByTestId("contact-image-fallback")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /專業清潔/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "加入 LINE 諮詢" })).toBeTruthy();
    expect(screen.getByRole("status", { name: "" }).textContent).toContain("目前尚未提供 LINE 諮詢連結");
    expect(screen.getByTestId("contact-info-empty")).toBeTruthy();
    expect(screen.queryByText("06-3584567")).toBeNull();
    expect(screen.queryByText("jagentclean@gmail.com")).toBeNull();
  });

  it("形象圖片載入失敗時顯示品牌替代內容並保留諮詢 CTA", () => {
    testState.settings = {
      siteName: "測試品牌",
      contactImageUrl: "/manus-storage/missing-image.webp",
      lineUrl: "https://example.test/line",
      companyPhone: "0800-123-456",
      companyEmail: "service@example.test",
      companyAddress: "測試地址",
      companyFax: "0800-654-321",
    };
    render(<Contact />);
    const image = screen.getByAltText("測試品牌專業服務團隊");
    fireEvent.error(image);
    expect(screen.queryByAltText("測試品牌專業服務團隊")).toBeNull();
    expect(screen.getByTestId("contact-image-fallback")).toBeTruthy();
    expect(screen.getByRole("link", { name: /加入 LINE 官方帳號/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "0800-123-456" }).getAttribute("href")).toBe("tel:0800123456");
    expect(screen.getByRole("link", { name: "service@example.test" }).getAttribute("href")).toBe("mailto:service@example.test");
  });
});
