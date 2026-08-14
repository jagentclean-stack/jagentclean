import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getCategoriesByType: vi.fn(),
  createCategory: vi.fn(),
  getCategoryById: vi.fn(),
  getServiceById: vi.fn(),
  createFAQ: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter } from "./cms";

const editorCaller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 3, email: "editor@example.com", role: "editor" } as never,
});
const customerServiceCaller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 4, email: "customer@example.com", role: "customer_service" } as never,
});

describe("FAQ 分類 CMS 安全性", () => {
  it("內容編輯者僅可透過 FAQ 類型取得 FAQ 分類", async () => {
    dbMock.getCategoriesByType.mockResolvedValueOnce([{ id: 6, name: "居家保養", type: "faq" }]);
    await expect(editorCaller.categories.list({ type: "faq" })).resolves.toEqual([{ id: 6, name: "居家保養", type: "faq" }]);
    expect(dbMock.getCategoriesByType).toHaveBeenCalledWith("faq");
  });

  it("內容編輯者可建立 FAQ 類型分類，客服不可建立", async () => {
    await editorCaller.categories.create({ name: "居家保養", slug: "home-care", type: "faq", order: 3 });
    expect(dbMock.createCategory).toHaveBeenCalledWith({ name: "居家保養", slug: "home-care", type: "faq", order: 3 });
    await expect(customerServiceCaller.categories.create({ name: "不得建立", slug: "blocked", type: "faq", order: 0 })).rejects.toThrow("Unauthorized");
  });

  it("FAQ 只能關聯 FAQ 類型分類，不可混用文章分類", async () => {
    dbMock.getCategoryById.mockResolvedValueOnce({ id: 2, type: "blog" });
    await expect(editorCaller.faqs.create({ question: "問題", answer: "答案", categoryId: 2, order: 0, isVisible: true })).rejects.toThrow("指定的 FAQ 分類不存在");
    expect(dbMock.createFAQ).not.toHaveBeenCalled();

    dbMock.getCategoryById.mockResolvedValueOnce({ id: 6, type: "faq" });
    await editorCaller.faqs.create({ question: "FAQ 分類問題", answer: "FAQ 分類答案", categoryId: 6, order: 2, isVisible: true });
    expect(dbMock.createFAQ).toHaveBeenCalledWith({ question: "FAQ 分類問題", answer: "FAQ 分類答案", categoryId: 6, order: 2, isVisible: true });
  });
});
