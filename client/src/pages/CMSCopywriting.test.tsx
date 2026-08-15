// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const state = vi.hoisted(() => ({
  user: { email: "marketing@jagent.example", role: "marketing" } as { email: string; role: string } | null,
  mutate: vi.fn(),
  data: undefined as unknown,
  error: null as Error | null,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: Boolean(state.user) }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      aiCopy: {
        generate: {
          useMutation: (options: { onSuccess?: () => void; onError?: (error: Error) => void }) => ({
            isPending: false,
            data: state.data,
            mutate: (input: unknown) => {
              state.mutate(input);
              if (state.error) {
                options.onError?.(state.error);
                return;
              }
              if (state.data) options.onSuccess?.();
            },
          }),
        },
      },
    },
  },
}));

import CMSCopywriting from "./CMSCopywriting";

afterEach(() => {
  cleanup();
  state.user = { email: "marketing@jagent.example", role: "marketing" };
  state.data = undefined;
  state.error = null;
  state.mutate.mockReset();
});

describe("CMSCopywriting", () => {
  it("拒絕沒有行銷文案權限的使用者", () => {
    state.user = { email: "employee@jagent.example", role: "employee" };
    render(<CMSCopywriting />);

    expect(screen.getByText("您沒有 AI 文案工作區的權限")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "產生 AI 草稿" })).toBeNull();
  });

  it("以確認的服務情境、語氣與指定管道產生草稿，且不會自動發佈", () => {
    render(<CMSCopywriting />);
    fireEvent.change(screen.getByLabelText(/服務情境/), { target: { value: "完成浴室除霉清潔，現場已完成通風與表面整理。" } });
    fireEvent.change(screen.getByLabelText(/已確認重點/), { target: { value: "不得承諾未確認的效果或價格。" } });
    fireEvent.change(screen.getByLabelText("品牌語氣"), { target: { value: "premium" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Google 商家" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "SEO 文章" }));
    fireEvent.click(screen.getByRole("button", { name: "產生 AI 草稿" }));

    expect(state.mutate).toHaveBeenCalledWith(expect.objectContaining({
      scenario: "完成浴室除霉清潔，現場已完成通風與表面整理。",
      keyPoints: "不得承諾未確認的效果或價格。",
      tone: "premium",
      channels: ["facebook", "instagram", "line", "googleBusiness", "seoArticle"],
    }));
    expect(screen.queryByText("發佈成功")).toBeNull();
  });

  it("顯示結構化草稿與複製控制，提醒使用者先人工覆核", () => {
    state.data = {
      facebook: { headline: "Facebook 草稿", body: "已確認的清潔作業內容。", hashtags: ["#潔特務清潔"] },
      instagram: { headline: "Instagram 草稿", body: "已確認的清潔作業內容。", hashtags: ["#清潔保養"] },
      line: { headline: "LINE 草稿", body: "已確認的清潔作業內容。", hashtags: [] },
      googleBusiness: { headline: "Google 商家草稿", body: "已確認的清潔作業內容。", hashtags: [] },
      seoArticle: { title: "SEO 文章草稿", metaDescription: "已確認服務情境的文章描述。", outline: ["服務情境", "作業流程"], body: "文章內文草稿。" },
    };
    render(<CMSCopywriting />);

    expect(screen.getByText("文案草稿")).toBeTruthy();
    expect(screen.getByText("Facebook 草稿")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "複製" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/每一份草稿皆須先確認服務事實與品牌用語/)).toBeTruthy();
  });

  it("在生成服務失敗時顯示明確錯誤提示，且不呈現成功或舊草稿狀態", () => {
    state.error = new Error("模型服務暫時無法使用，請稍後再試。");
    render(<CMSCopywriting />);
    fireEvent.change(screen.getByLabelText(/服務情境/), { target: { value: "完成已確認的浴室清潔服務。" } });
    fireEvent.click(screen.getByRole("button", { name: "產生 AI 草稿" }));

    expect(screen.getByRole("status").textContent).toContain("模型服務暫時無法使用");
    expect(screen.queryByText("AI 已產生草稿。請先核對事實與品牌語氣，再複製至對應管道發佈。")).toBeNull();
    expect(screen.queryByText("文案草稿")).toBeNull();
  });
});
