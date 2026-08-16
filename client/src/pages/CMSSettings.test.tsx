// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  shouldReject: false,
  settingsData: [{ key: "site_name", value: "原網站名稱" }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin", email: "jagentclean@gmail.com" }, isAuthenticated: true }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      cms: {
        publicContent: {
          siteSettings: { invalidate: async () => undefined },
          footer: { invalidate: async () => undefined },
        },
      },
    }),
    cms: {
      settings: {
        list: { useQuery: () => ({ data: testState.settingsData, isLoading: false }) },
        updateBatch: {
          useMutation: () => ({
            isPending: false,
            mutateAsync: async () => {
              if (testState.shouldReject) throw new Error("設定格式無效");
              return { success: true };
            },
          }),
        },
      },
    },
  },
}));

import CMSSettings from "./CMSSettings";

afterEach(() => {
  cleanup();
  testState.shouldReject = false;
  testState.settingsData = [{ key: "site_name", value: "原網站名稱" }];
});

describe("CMSSettings 批次儲存回饋", () => {
  it("批次儲存成功時顯示成功訊息", async () => {
    render(<CMSSettings />);
    fireEvent.click(screen.getByRole("button", { name: "保存設定" }));
    expect((await screen.findByRole("status")).textContent).toContain("設定已儲存並同步至網站。");
  });

  it("儲存失敗時顯示錯誤並保留使用者輸入", async () => {
    testState.shouldReject = true;
    render(<CMSSettings />);
    const siteNameInput = screen.getByPlaceholderText("潔特務清潔");
    fireEvent.change(siteNameInput, { target: { value: "新名稱" } });
    fireEvent.click(screen.getByRole("button", { name: "保存設定" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("設定格式無效"));
    expect((siteNameInput as HTMLInputElement).value).toBe("新名稱");
  });

  it("讀取並可編輯 Logo 圖片網址", () => {
    testState.settingsData = [
      { key: "site_name", value: "原網站名稱" },
      { key: "logo_url", value: "/manus-storage/custom-logo.png" },
    ];
    render(<CMSSettings />);
    const logoInput = screen.getByPlaceholderText("/manus-storage/your-logo.png") as HTMLInputElement;
    expect(logoInput.value).toBe("/manus-storage/custom-logo.png");
    fireEvent.change(logoInput, { target: { value: "https://cdn.example.com/logo.png" } });
    expect(logoInput.value).toBe("https://cdn.example.com/logo.png");
  });
});
