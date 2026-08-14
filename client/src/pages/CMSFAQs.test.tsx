// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "admin", email: "jagentclean@gmail.com" },
  createAsync: vi.fn(async () => undefined),
  updateAsync: vi.fn(async () => undefined),
  remove: vi.fn(),
  faqs: [{ id: 3, question: "石材要多久保養一次？", answer: "依現場使用情況評估。", serviceId: 9, order: 2, isVisible: true }],
  services: [{ id: 9, name: "石材保養", isPublished: true }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: state.authenticated }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      cms: {
        faqs: { list: { invalidate: vi.fn() } },
        publicContent: { services: { invalidate: vi.fn() } },
      },
    }),
    cms: {
      faqs: {
        list: { useQuery: () => ({ data: state.faqs, isLoading: false }) },
        create: { useMutation: () => ({ isPending: false, mutateAsync: state.createAsync }) },
        update: { useMutation: () => ({ isPending: false, mutateAsync: state.updateAsync }) },
        delete: { useMutation: () => ({ isPending: false, mutate: state.remove }) },
      },
      services: { list: { useQuery: () => ({ data: state.services }) } },
    },
  },
}));

import CMSFAQs from "./CMSFAQs";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  state.authenticated = true;
  state.user = { role: "admin", email: "jagentclean@gmail.com" };
  state.createAsync.mockClear();
  state.updateAsync.mockClear();
  state.remove.mockClear();
  vi.restoreAllMocks();
});

describe("CMSFAQs 服務關聯管理", () => {
  it("未授權使用者不能查看 FAQ 管理介面", () => {
    state.authenticated = false;
    state.user = { role: "customer_service", email: "cs@example.com" };
    render(<CMSFAQs />);
    expect(screen.getByText("您沒有權限存取 FAQ 管理。")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "新增 FAQ" })).toBeNull();
  });

  it("管理員可建立指定服務、排序與顯示狀態的 FAQ", () => {
    render(<CMSFAQs />);
    fireEvent.click(screen.getByRole("button", { name: "新增 FAQ" }));
    fireEvent.change(screen.getByLabelText("問題 *"), { target: { value: "石材清潔需要準備什麼？" } });
    fireEvent.change(screen.getByLabelText("答案 *"), { target: { value: "請先清空施工區域。" } });
    fireEvent.change(screen.getByLabelText("關聯服務"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("排序"), { target: { value: "4" } });
    fireEvent.click(screen.getByLabelText("在公開網站顯示"));
    fireEvent.click(screen.getByRole("button", { name: "建立 FAQ" }));

    expect(state.createAsync).toHaveBeenCalledWith({
      question: "石材清潔需要準備什麼？",
      answer: "請先清空施工區域。",
      serviceId: 9,
      order: 4,
      isVisible: false,
    });
  });

  it("管理員可展開並確認刪除服務專屬 FAQ", () => {
    render(<CMSFAQs />);
    fireEvent.click(screen.getByRole("button", { name: /石材要多久保養一次/ }));
    fireEvent.click(screen.getByRole("button", { name: "刪除" }));
    expect(window.confirm).toHaveBeenCalled();
    expect(state.remove).toHaveBeenCalledWith({ id: 3 });
  });

  it("管理員可修改既有 FAQ 的內容、服務、排序與顯示狀態並收到成功回饋", async () => {
    render(<CMSFAQs />);
    fireEvent.click(screen.getByRole("button", { name: /石材要多久保養一次/ }));
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.change(screen.getByLabelText("問題 *"), { target: { value: "更新後的石材問題" } });
    fireEvent.change(screen.getByLabelText("答案 *"), { target: { value: "更新後的石材答案" } });
    fireEvent.change(screen.getByLabelText("排序"), { target: { value: "8" } });
    fireEvent.click(screen.getByLabelText("在公開網站顯示"));
    fireEvent.click(screen.getByRole("button", { name: "儲存變更" }));

    expect(state.updateAsync).toHaveBeenCalledWith({
      id: 3,
      question: "更新後的石材問題",
      answer: "更新後的石材答案",
      serviceId: 9,
      order: 8,
      isVisible: false,
    });
    expect((await screen.findByRole("status")).textContent).toContain("FAQ 已更新");
  });

  it("FAQ 更新失敗時保留對話框並顯示錯誤訊息", async () => {
    state.updateAsync.mockRejectedValueOnce(new Error("儲存失敗"));
    render(<CMSFAQs />);
    fireEvent.click(screen.getByRole("button", { name: /石材要多久保養一次/ }));
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    fireEvent.click(screen.getByRole("button", { name: "儲存變更" }));
    expect((await screen.findByRole("alert")).textContent).toContain("儲存失敗");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
