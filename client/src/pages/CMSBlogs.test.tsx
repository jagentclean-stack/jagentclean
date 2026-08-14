// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "super_admin", email: "jagentclean@gmail.com" },
  blogs: [{
    id: 7,
    title: "浴室清潔指南",
    slug: "bathroom-cleaning-guide",
    excerpt: "既有文章摘要",
    content: "既有內容",
    featuredImage: "/manus-storage/bathroom.webp",
    categoryId: 3,
    isPublished: true,
    publishedAt: new Date("2026-08-10T08:00:00.000Z"),
    scheduledAt: null,
    seoTitle: "既有 SEO 標題",
    seoDescription: "既有 SEO 描述",
    seoKeywords: "浴室清潔",
  }],
  categories: [{ id: 3, name: "清潔知識" }],
  refetch: vi.fn(),
  createAsync: vi.fn(async () => ({ success: true })),
  updateAsync: vi.fn(async () => ({ success: true })),
  remove: vi.fn(async () => ({ success: true })),
  mutation: (handler: (...args: any[]) => any, options: any = {}) => ({
    isPending: false,
    mutate: async (...args: any[]) => {
      try { const result = await handler(...args); await options.onSuccess?.(result); return result; }
      catch (error) { options.onError?.(error); throw error; }
    },
    mutateAsync: async (...args: any[]) => {
      try { const result = await handler(...args); await options.onSuccess?.(result); return result; }
      catch (error) { options.onError?.(error); throw error; }
    },
  }),
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: state.user, isAuthenticated: state.authenticated }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      blogs: {
        list: { useQuery: () => ({ data: state.blogs, isLoading: false, refetch: state.refetch }) },
        create: { useMutation: (options: any) => state.mutation(state.createAsync, options) },
        update: { useMutation: (options: any) => state.mutation(state.updateAsync, options) },
        delete: { useMutation: (options: any) => state.mutation(state.remove, options) },
      },
      categories: { list: { useQuery: () => ({ data: state.categories }) } },
    },
  },
}));

import CMSBlogs from "./CMSBlogs";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  state.authenticated = true;
  state.user = { role: "super_admin", email: "jagentclean@gmail.com" };
  state.createAsync.mockReset(); state.createAsync.mockResolvedValue({ success: true });
  state.updateAsync.mockReset(); state.updateAsync.mockResolvedValue({ success: true });
  state.remove.mockReset(); state.remove.mockResolvedValue({ success: true });
  state.refetch.mockReset();
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("CMSBlogs 文章管理", () => {
  it("未授權使用者不能管理文章", () => {
    state.authenticated = false;
    state.user = { role: "customer_service", email: "service@example.com" };
    render(<CMSBlogs />);
    expect(screen.getByText("您沒有權限存取文章管理。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "新增文章" })).toBeNull();
  });

  it("最高權限管理員可建立含分類、封面、排程與 SEO 的文章", async () => {
    render(<CMSBlogs />);
    fireEvent.click(screen.getByRole("button", { name: "新增文章" }));
    fireEvent.change(screen.getByLabelText("文章標題 *"), { target: { value: "浴室除霉完整指南" } });
    fireEvent.change(screen.getByLabelText("URL Slug *"), { target: { value: "bathroom-mold-guide" } });
    fireEvent.change(screen.getByLabelText("文章分類"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("封面圖片網址"), { target: { value: "/manus-storage/mold-guide.webp" } });
    fireEvent.change(screen.getByLabelText("文章摘要"), { target: { value: "除霉重點摘要" } });
    fireEvent.change(screen.getByLabelText("文章內容"), { target: { value: "完整內容" } });
    fireEvent.change(screen.getByLabelText("排程公開時間"), { target: { value: "2026-08-20T09:30" } });
    fireEvent.change(screen.getByLabelText("SEO 標題"), { target: { value: "浴室除霉完整指南" } });
    fireEvent.click(screen.getByRole("switch", { name: "公開文章" }));
    fireEvent.click(screen.getByRole("button", { name: "建立文章" }));
    await waitFor(() => expect(state.createAsync).toHaveBeenCalledWith(expect.objectContaining({
      title: "浴室除霉完整指南", slug: "bathroom-mold-guide", categoryId: 3,
      featuredImage: "/manus-storage/mold-guide.webp", isPublished: true, seoTitle: "浴室除霉完整指南",
      scheduledAt: expect.any(Date),
    })));
    expect((await screen.findByRole("status")).textContent).toContain("文章已建立");
  });

  it("管理員可編輯既有文章、切換發布並收到成功提示", async () => {
    render(<CMSBlogs />);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.change(screen.getByLabelText("文章標題 *"), { target: { value: "修訂後浴室指南" } });
    fireEvent.click(screen.getByRole("switch", { name: "公開文章" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存文章" }));
    await waitFor(() => expect(state.updateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 7, title: "修訂後浴室指南", isPublished: false })));
    expect((await screen.findByRole("status")).textContent).toContain("文章已更新");
  });

  it("文章更新失敗時保留對話框並顯示可讀錯誤", async () => {
    state.updateAsync.mockRejectedValueOnce(new Error("network failed"));
    render(<CMSBlogs />);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存文章" }));
    expect((await screen.findByRole("alert")).textContent).toContain("更新失敗");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("最高權限管理員可刪除文章", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<CMSBlogs />);
    fireEvent.click(screen.getByRole("button", { name: "刪除 浴室清潔指南" }));
    await waitFor(() => expect(state.remove).toHaveBeenCalledWith({ id: 7 }));
    expect((await screen.findByRole("status")).textContent).toContain("文章已刪除");
  });
});
