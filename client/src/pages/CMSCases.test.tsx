// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "super_admin", email: "jagentclean@gmail.com" },
  cases: [{
    id: 3,
    title: "浴室除霉案例",
    slug: "bathroom-mold-removal",
    address: "台南市安南區",
    serviceId: 2,
    constructionDate: new Date("2026-08-01T00:00:00.000Z"),
    constructionTime: "4 小時",
    beforeImages: ["/manus-storage/before.webp"],
    afterImages: ["/manus-storage/after.webp"],
    video: "https://youtu.be/example",
    testimonial: "浴室恢復乾淨明亮。",
    googleReview: "https://g.page/r/example/review",
    tags: ["浴室", "除霉"],
    categoryId: 4,
    order: 2,
    isPublished: true,
  }],
  createAsync: vi.fn(async () => ({ success: true })),
  updateAsync: vi.fn(async () => ({ success: true })),
  remove: vi.fn(),
  mutation: (handler: (...args: any[]) => any, options: any = {}) => ({
    isPending: false,
    mutate: (...args: any[]) => {
      try {
        const result = handler(...args);
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        options.onError?.(error);
        throw error;
      }
    },
    mutateAsync: async (...args: any[]) => {
      try {
        const result = await handler(...args);
        await options.onSuccess?.(result);
        return result;
      } catch (error) {
        options.onError?.(error);
        throw error;
      }
    },
  }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: state.authenticated }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      cms: {
        cases: { list: { invalidate: vi.fn(async () => undefined) } },
        publicContent: { cases: { invalidate: vi.fn(async () => undefined) } },
      },
    }),
    cms: {
      cases: {
        list: { useQuery: () => ({ data: state.cases, isLoading: false }) },
        create: { useMutation: (options: any) => state.mutation(state.createAsync, options) },
        update: { useMutation: (options: any) => state.mutation(state.updateAsync, options) },
        delete: { useMutation: (options: any) => state.mutation(state.remove, options) },
      },
    },
  },
}));

import CMSCases from "./CMSCases";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  state.authenticated = true;
  state.user = { role: "super_admin", email: "jagentclean@gmail.com" };
  state.createAsync.mockReset();
  state.createAsync.mockResolvedValue({ success: true });
  state.updateAsync.mockReset();
  state.updateAsync.mockResolvedValue({ success: true });
  state.remove.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("CMSCases 案例管理", () => {
  it("未授權使用者不能載入案例管理頁", () => {
    state.authenticated = false;
    state.user = { role: "customer_service", email: "service@example.com" };
    render(<CMSCases />);
    expect(screen.getByText("您沒有管理案例內容的權限。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "新增案例" })).toBeNull();
  });

  it("最高權限管理員可以建立包含媒體、分類、標籤與公開狀態的案例", async () => {
    render(<CMSCases />);
    fireEvent.click(screen.getByRole("button", { name: "新增案例" }));
    fireEvent.change(screen.getByLabelText("案例標題 *"), { target: { value: "更新浴室除霉案例" } });
    fireEvent.change(screen.getByLabelText("URL Slug *"), { target: { value: "updated-bathroom-case" } });
    fireEvent.change(screen.getByLabelText("施工地址"), { target: { value: "台南市中西區" } });
    fireEvent.change(screen.getByLabelText("服務 ID"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("施工日期"), { target: { value: "2026-08-12" } });
    fireEvent.change(screen.getByLabelText("Before 圖片 URL"), { target: { value: "/manus-storage/before-1.webp, /manus-storage/before-2.webp" } });
    fireEvent.change(screen.getByLabelText("After 圖片 URL"), { target: { value: "/manus-storage/after-1.webp" } });
    fireEvent.change(screen.getByLabelText("標籤"), { target: { value: "浴室, 除霉" } });
    fireEvent.change(screen.getByLabelText("案例分類 ID"), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText("排序"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存案例" }));

    await waitFor(() => expect(state.createAsync).toHaveBeenCalledWith(expect.objectContaining({
      title: "更新浴室除霉案例",
      slug: "updated-bathroom-case",
      address: "台南市中西區",
      serviceId: 2,
      categoryId: 4,
      beforeImages: ["/manus-storage/before-1.webp", "/manus-storage/before-2.webp"],
      afterImages: ["/manus-storage/after-1.webp"],
      tags: ["浴室", "除霉"],
      order: 5,
      isPublished: true,
    })));
    expect((await screen.findByRole("status")).textContent).toContain("案例已建立");
  });

  it("管理員可編輯既有案例、變更發布狀態並收到成功提示", async () => {
    render(<CMSCases />);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.change(screen.getByLabelText("案例標題 *"), { target: { value: "編輯後案例標題" } });
    fireEvent.click(screen.getByRole("switch", { name: "公開案例" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存案例" }));

    await waitFor(() => expect(state.updateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: 3,
      title: "編輯後案例標題",
      isPublished: false,
      serviceId: 2,
      categoryId: 4,
    })));
    expect((await screen.findByRole("status")).textContent).toContain("案例內容已更新");
  });

  it("儲存失敗時保留對話框並顯示可讀錯誤", async () => {
    state.updateAsync.mockRejectedValueOnce(new Error("儲存失敗"));
    render(<CMSCases />);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存案例" }));
    expect((await screen.findByRole("alert")).textContent).toContain("儲存失敗");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("最高權限管理員可以刪除案例", () => {
    render(<CMSCases />);
    fireEvent.click(screen.getByRole("button", { name: "刪除 浴室除霉案例" }));
    expect(state.remove).toHaveBeenCalledWith({ id: 3 });
  });
});
