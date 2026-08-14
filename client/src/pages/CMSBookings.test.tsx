// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  isPending: false,
  shouldError: false,
  mutationOptions: undefined as { onError?: (error: Error) => void } | undefined,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin" }, isAuthenticated: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      bookings: {
        list: { useQuery: () => ({ data: [{ id: 1, name: "測試預約", status: "pending", phone: "06-3584567", email: null, line: null, address: null, bookingDate: null, requirements: null }], isLoading: false, error: null, refetch: vi.fn() }) },
        update: { useMutation: (options: { onError?: (error: Error) => void }) => {
          testState.mutationOptions = options;
          return {
            isPending: testState.isPending,
            mutate: () => {
              testState.isPending = true;
              if (testState.shouldError) options.onError?.(new Error("預約狀態無法更新"));
            },
          };
        } },
      },
    },
  },
}));

import CMSBookings from "./CMSBookings";

beforeAll(() => {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: { configurable: true, value: () => false },
    setPointerCapture: { configurable: true, value: () => undefined },
    releasePointerCapture: { configurable: true, value: () => undefined },
    scrollIntoView: { configurable: true, value: () => undefined },
  });
});

afterEach(() => {
  cleanup();
  testState.isPending = false;
  testState.shouldError = false;
  testState.mutationOptions = undefined;
});

describe("CMSBookings mutation 回饋", () => {
  async function selectQuotedStatus() {
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("更新 測試預約 的預約狀態"));
    await user.click(await screen.findByRole("option", { name: "已報價" }));
  }

  it("使用者變更狀態後會顯示明確的更新中訊息與該筆預約的進度", async () => {
    render(<CMSBookings />);
    await selectQuotedStatus();
    expect(screen.getByRole("status").textContent).toContain("正在更新預約狀態…");
    expect(screen.getByText("更新中")).toBeTruthy();
  });

  it("使用者變更狀態失敗時會在頁面上顯示錯誤訊息", async () => {
    testState.shouldError = true;
    render(<CMSBookings />);
    await selectQuotedStatus();
    expect(screen.getByRole("alert").textContent).toContain("預約狀態無法更新");
  });
});
