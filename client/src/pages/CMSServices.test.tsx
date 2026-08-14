// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

const testState = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "admin", email: "jagentclean@gmail.com" },
  updateAsync: vi.fn(async () => ({ success: true })),
  createAsync: vi.fn(async () => ({ success: true })),
  remove: vi.fn(),
  services: [{
    id: 3,
    name: "居家清潔",
    slug: "home-cleaning",
    description: "原始介紹",
    process: "原始流程",
    faq: "原始常見問題",
    icon: "/manus-storage/icon.png",
    bannerImage: "/manus-storage/banner.png",
    video: "https://example.com/video",
    basePrice: "2000",
    pricePerUnit: "500",
    unit: "坪",
    promotion: "原始優惠",
    priceNote: "原始備註",
    seoTitle: "原始 SEO",
    seoDescription: "原始 SEO 描述",
    seoKeywords: "清潔",
    isPublished: true,
  }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: testState.user, isAuthenticated: testState.authenticated }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      cms: {
        services: { list: { invalidate: vi.fn() } },
        publicContent: { services: { invalidate: vi.fn() } },
      },
    }),
    cms: {
      services: {
        list: { useQuery: () => ({ data: testState.services, isLoading: false }) },
        create: { useMutation: () => ({ isPending: false, mutateAsync: testState.createAsync }) },
        update: { useMutation: () => ({ isPending: false, mutateAsync: testState.updateAsync }) },
        delete: { useMutation: () => ({ isPending: false, mutate: testState.remove }) },
      },
    },
  },
}));

import CMSServices from "./CMSServices";

afterEach(() => {
  cleanup();
  testState.authenticated = true;
  testState.user = { role: "admin", email: "jagentclean@gmail.com" };
  testState.updateAsync.mockClear();
  testState.createAsync.mockClear();
});

describe("CMSServices 完整欄位管理", () => {
  it("未授權使用者無法讀取服務表單", () => {
    testState.authenticated = false;
    testState.user = { role: "marketing", email: "marketing@example.com" };
    render(<CMSServices />);
    expect(screen.getByText("您沒有管理服務內容的權限。")).toBeTruthy();
    expect(screen.queryByText("新增服務")).toBeNull();
  });

  it("管理員可編輯流程、FAQ、圖片、價格、SEO 與公開狀態後送出", () => {
    render(<CMSServices />);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.change(screen.getByLabelText("服務流程"), { target: { value: "現場評估 → 執行 → 驗收" } });
    fireEvent.change(screen.getByLabelText("服務專屬 FAQ"), { target: { value: "清潔時間需要多久？\n依現場評估而定。" } });
    fireEvent.change(screen.getByLabelText("Banner 圖片 URL"), { target: { value: "/manus-storage/new-banner.webp" } });
    fireEvent.change(screen.getByLabelText("最低價格（NT$）"), { target: { value: "2800" } });
    fireEvent.change(screen.getByLabelText("SEO Title"), { target: { value: "台南居家清潔｜潔特務清潔" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存服務" }));

    expect(testState.updateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: 3,
      process: "現場評估 → 執行 → 驗收",
      faq: "清潔時間需要多久？\n依現場評估而定。",
      bannerImage: "/manus-storage/new-banner.webp",
      basePrice: "2800",
      seoTitle: "台南居家清潔｜潔特務清潔",
      isPublished: true,
    }));
  });
});
