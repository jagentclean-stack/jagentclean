// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  isPending: false,
  mutationOptions: undefined as { onError?: (error: Error) => void } | undefined,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "customer_service" }, isAuthenticated: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      contacts: {
        list: { useQuery: () => ({ data: [{ id: 1, name: "測試聯繫人", phone: null, email: null, message: "請協助報價", isRead: false, createdAt: new Date("2026-08-14T00:00:00.000Z") }], isLoading: false, error: null, refetch: vi.fn() }) },
        markAsRead: { useMutation: (options: { onError?: (error: Error) => void }) => { testState.mutationOptions = options; return { isPending: testState.isPending, mutate: () => { testState.isPending = true; } }; } },
      },
    },
  },
}));

import CMSContacts from "./CMSContacts";

afterEach(() => {
  cleanup();
  testState.isPending = false;
  testState.mutationOptions = undefined;
});

describe("CMSContacts mutation 回饋", () => {
  it("標記已讀進行中會顯示進度訊息與按鈕文案", async () => {
    render(<CMSContacts />);
    await userEvent.setup().click(screen.getByRole("button", { name: "標記為已讀" }));
    expect(screen.getByRole("status").textContent).toContain("正在更新訊息狀態…");
    expect(screen.getByRole("button", { name: /更新中/ }).hasAttribute("disabled")).toBe(true);
  });

  it("標記已讀失敗時會顯示錯誤訊息，且缺少聯絡資料有明確提示", () => {
    render(<CMSContacts />);
    act(() => testState.mutationOptions?.onError?.(new Error("訊息狀態無法更新")));
    expect(screen.getByRole("alert").textContent).toContain("訊息狀態無法更新");
    expect(screen.getByText("未提供電話")).toBeTruthy();
    expect(screen.getByText("未提供 Email")).toBeTruthy();
  });
});
