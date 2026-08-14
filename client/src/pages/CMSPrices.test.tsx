// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "admin", email: "jagentclean@gmail.com" },
  mutate: vi.fn(),
  services: [{
    id: 7,
    name: "居家清潔",
    slug: "home-cleaning",
    basePrice: "2000",
    pricePerUnit: "500",
    unit: "坪",
    promotion: "首次預約九折",
    priceNote: "依現場狀況報價",
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
        update: { useMutation: () => ({ isPending: false, mutate: testState.mutate }) },
      },
    },
  },
}));

import CMSPrices from "./CMSPrices";

afterEach(() => {
  cleanup();
  testState.authenticated = true;
  testState.user = { role: "admin", email: "jagentclean@gmail.com" };
  testState.mutate.mockReset();
});

describe("CMSPrices 管理介面", () => {
  it("未授權使用者不能查看價格表單", () => {
    testState.authenticated = false;
    testState.user = { role: "editor", email: "editor@example.com" };
    render(<CMSPrices />);
    expect(screen.getByText("您沒有管理服務價格的權限。")).toBeTruthy();
    expect(screen.queryByLabelText("最低價格（NT$）")).toBeNull();
  });

  it("管理員可修改基礎價格、單位價格與優惠後送出", () => {
    render(<CMSPrices />);
    fireEvent.change(screen.getByLabelText("最低價格（NT$）"), { target: { value: "2600" } });
    fireEvent.change(screen.getByLabelText("單位價格（NT$）"), { target: { value: "650" } });
    fireEvent.change(screen.getByLabelText("優惠訊息"), { target: { value: "平日預約九折" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存此服務價格" }));

    expect(testState.mutate).toHaveBeenCalledWith(expect.objectContaining({
      id: 7,
      basePrice: "2600",
      pricePerUnit: "650",
      promotion: "平日預約九折",
    }));
  });
});
