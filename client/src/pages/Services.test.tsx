// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

class TestIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("IntersectionObserver", TestIntersectionObserver);

const state = vi.hoisted(() => ({
  data: [] as Array<Record<string, unknown>>,
  isLoading: false,
  isError: false,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: { cms: { publicContent: { services: { useQuery: () => state } } } },
}));

import Services from "./Services";

afterEach(() => {
  cleanup();
  state.data = [];
  state.isLoading = false;
  state.isError = false;
});

describe("公開服務價格展示", () => {
  it("顯示已發布服務的最低價、單位價格、優惠與報價備註", () => {
    state.data = [{ id: 1, name: "居家清潔", description: "專業居家清潔", basePrice: "2000", pricePerUnit: "500", unit: "坪", promotion: "首次預約優惠", priceNote: "實際費用依現場確認。", faqs: [] }];
    render(<Services />);
    expect(screen.getByText("NT$ 2,000 起")).toBeTruthy();
    expect(screen.getByText("NT$ 500／坪")).toBeTruthy();
    expect(screen.getByText("首次預約優惠")).toBeTruthy();
    expect(screen.getByText("實際費用依現場確認。")).toBeTruthy();
  });

  it("服務尚未設定價格時不顯示價格區塊", () => {
    state.data = [{ id: 2, name: "水塔清洗", description: "專業水塔清洗", basePrice: null, pricePerUnit: null, unit: null, promotion: null, priceNote: null, faqs: [] }];
    render(<Services />);
    expect(screen.getByText("水塔清洗")).toBeTruthy();
    expect(screen.queryByText(/NT\$/)).toBeNull();
  });

  it("顯示已發布服務的專屬 FAQ，並保留換行內容", () => {
    state.data = [{ id: 3, name: "冷氣清洗", description: "深度清洗", faqs: [{ id: 9, question: "多久需要清洗一次？", answer: "建議每年定期保養。" }], basePrice: null, pricePerUnit: null, promotion: null, priceNote: null }];
    render(<Services />);
    expect(screen.getByText("此服務的常見問題")).toBeTruthy();
    expect(screen.getByText("多久需要清洗一次？")).toBeTruthy();
    expect(screen.getByText("建議每年定期保養。")).toBeTruthy();
  });

  it("資料讀取失敗時顯示清楚的聯繫引導", () => {
    state.isError = true;
    render(<Services />);
    expect(screen.getByRole("alert").textContent).toContain("服務資訊暫時無法載入");
  });
});
