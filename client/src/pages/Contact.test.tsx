// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  settings: null as null | {
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
    expect(screen.queryByAltText("潔特務清潔專業服務團隊")).toBeNull();
    expect(screen.getByTestId("contact-image-fallback")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /專業清潔/ })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "加入 LINE 諮詢" })).toBeTruthy();
  });

  it("形象圖片載入失敗時顯示品牌替代內容並保留諮詢 CTA", () => {
    testState.settings = { contactImageUrl: "/manus-storage/missing-image.webp" };
    render(<Contact />);
    const image = screen.getByAltText("潔特務清潔專業服務團隊");
    fireEvent.error(image);
    expect(screen.queryByAltText("潔特務清潔專業服務團隊")).toBeNull();
    expect(screen.getByTestId("contact-image-fallback")).toBeTruthy();
    expect(screen.getByRole("link", { name: /加入 LINE 官方帳號/ })).toBeTruthy();
  });
});
