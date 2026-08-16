// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  shouldReject: false,
  settingsData: [{ key: "site_name", value: "原網站名稱" }],
  footerData: { id: 7, aboutText: "原頁尾介紹", isPublished: true },
  footerUpdateCalls: 0,
  lastFooterUpdate: null as unknown,
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
        footer: { get: { invalidate: async () => undefined } },
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
      footer: {
        get: { useQuery: () => ({ data: testState.footerData }) },
        create: { useMutation: () => ({ isPending: false, mutateAsync: async () => ({ id: 8 }) }) },
        update: {
          useMutation: () => ({
            isPending: false,
            mutateAsync: async (input: unknown) => {
              testState.footerUpdateCalls += 1;
              testState.lastFooterUpdate = input;
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
  testState.footerData = { id: 7, aboutText: "原頁尾介紹", isPublished: true };
  testState.footerUpdateCalls = 0;
  testState.lastFooterUpdate = null;
});

describe("CMSSettings 批次儲存回饋", () => {
  it("批次儲存成功時顯示成功訊息", async () => {
    render(<CMSSettings />);
    fireEvent.click(screen.getByRole("button", { name: "保存設定" }));
    expect((await screen.findByRole("status")).textContent).toContain("設定已儲存，並已同步至前台。");
    expect(testState.footerUpdateCalls).toBe(1);
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

  it("在同一個入口管理頁尾介紹與發布狀態", () => {
    render(<CMSSettings />);
    const aboutInput = screen.getByPlaceholderText("輸入顯示於頁尾的品牌簡介") as HTMLTextAreaElement;
    expect(aboutInput.value).toBe("原頁尾介紹");
    expect((screen.getByRole("checkbox", { name: "發布頁尾內容" }) as HTMLInputElement).checked).toBe(true);
    fireEvent.change(aboutInput, { target: { value: "更新後的品牌介紹" } });
    fireEvent.click(screen.getByRole("button", { name: "保存設定" }));
    return waitFor(() => expect(testState.lastFooterUpdate).toEqual({ id: 7, aboutText: "更新後的品牌介紹", isPublished: true }));
  });
});
