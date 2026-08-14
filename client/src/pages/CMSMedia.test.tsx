// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  authenticated: true,
  user: { role: "admin", email: "jagentclean@gmail.com" },
  refetch: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(async () => ({ id: 1 })),
  update: vi.fn(async () => ({ id: 1 })),
  media: [
    { id: 1, filename: "kitchen-before.webp", url: "/kitchen.webp", type: "image", category: "案例", alt: "廚房清潔前", tags: ["案例", "廚房"] },
    { id: 2, filename: "stone-care.mp4", url: "/stone.mp4", type: "video", category: "服務", alt: "石材保養影片" },
  ],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: testState.user, isAuthenticated: testState.authenticated }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    cms: {
      media: {
        list: { useQuery: () => ({ data: testState.media, isLoading: false, refetch: testState.refetch }) },
        delete: { useMutation: () => ({ mutate: testState.remove, isPending: false }) },
        upload: { useMutation: () => ({ mutateAsync: testState.upload, isPending: false }) },
        update: { useMutation: () => ({ mutateAsync: testState.update, isPending: false }) },
      },
    },
  },
}));

import CMSMedia from "./CMSMedia";

class TestFileReader {
  result = "";
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  readAsDataURL(file: File) {
    this.result = `data:${file.type};base64,dGVzdA==`;
    queueMicrotask(() => this.onload?.());
  }
}

afterEach(() => {
  cleanup();
  testState.authenticated = true;
  testState.user = { role: "admin", email: "jagentclean@gmail.com" };
  testState.refetch.mockReset();
  testState.remove.mockReset();
  testState.upload.mockReset();
  testState.upload.mockResolvedValue({ id: 1 });
  testState.update.mockReset();
  testState.update.mockResolvedValue({ id: 1 });
  vi.stubGlobal("FileReader", TestFileReader);
});

describe("CMSMedia 管理介面", () => {
  it("未授權使用者無法瀏覽媒體內容", () => {
    testState.authenticated = false;
    testState.user = { role: "customer_service", email: "support@example.com" };
    render(<CMSMedia />);
    expect(screen.getByText("無法存取此頁面")).toBeTruthy();
    expect(screen.queryByText("媒體中心")).toBeNull();
  });

  it("可依檔名、分類與替代文字搜尋媒體", () => {
    render(<CMSMedia />);
    fireEvent.change(screen.getByLabelText("搜尋媒體"), { target: { value: "石材" } });
    expect(screen.getByText("stone-care.mp4")).toBeTruthy();
    expect(screen.queryByText("kitchen-before.webp")).toBeNull();
  });

  it("管理員可選擇多檔並依序上傳", async () => {
    render(<CMSMedia />);
    fireEvent.click(screen.getByRole("button", { name: "上傳媒體" }));
    const fileInput = screen.getByLabelText("檔案");
    const image = new File(["image"], "room.webp", { type: "image/webp" });
    const video = new File(["video"], "room.mp4", { type: "video/mp4" });
    fireEvent.change(fileInput, { target: { files: [image, video] } });
    expect(screen.getByText(/已選取 2 個檔案/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "開始上傳" }));
    await waitFor(() => expect(testState.upload).toHaveBeenCalledTimes(2));
    expect(testState.upload).toHaveBeenNthCalledWith(1, expect.objectContaining({ filename: "room.webp", mimeType: "image/webp" }));
    expect(testState.upload).toHaveBeenNthCalledWith(2, expect.objectContaining({ filename: "room.mp4", mimeType: "video/mp4" }));
    await waitFor(() => expect(testState.refetch).toHaveBeenCalledTimes(1));
  });

  it("管理員可更新媒體名稱、替代文字與標籤", async () => {
    render(<CMSMedia />);
    fireEvent.click(screen.getByRole("button", { name: "編輯 kitchen-before.webp" }));
    fireEvent.change(screen.getByLabelText("媒體名稱"), { target: { value: "kitchen-after.webp" } });
    fireEvent.change(screen.getByLabelText("替代文字"), { target: { value: "完成後的廚房清潔" } });
    fireEvent.change(screen.getByLabelText("標籤"), { target: { value: "案例, 完工, 廚房" } });
    fireEvent.click(screen.getByRole("button", { name: "儲存中繼資料" }));
    await waitFor(() => expect(testState.update).toHaveBeenCalledWith({
      id: 1,
      filename: "kitchen-after.webp",
      category: "案例",
      alt: "完成後的廚房清潔",
      tags: ["案例", "完工", "廚房"],
    }));
    expect(await screen.findByText("媒體資料已儲存。")).toBeTruthy();
  });
});
