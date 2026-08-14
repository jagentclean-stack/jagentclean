import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getServiceById: vi.fn(),
  createFAQ: vi.fn(),
  getPublishedServicesWithFAQs: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter } from "./cms";

const adminCaller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 1, email: "jagentclean@gmail.com", role: "admin" } as never,
});
const publicCaller = cmsRouter.createCaller({ req: {} as never, res: {} as never, user: null });

describe("FAQ 與服務關聯安全性", () => {
  it("拒絕關聯至不存在的服務，且不建立 FAQ", async () => {
    dbMock.getServiceById.mockResolvedValueOnce(null);
    await expect(adminCaller.faqs.create({ question: "問題", answer: "答案", serviceId: 999, order: 0, isVisible: true })).rejects.toThrow("指定的服務不存在");
    expect(dbMock.createFAQ).not.toHaveBeenCalled();
  });

  it("公開服務僅輸出已發布服務及其可見 FAQ", async () => {
    dbMock.getPublishedServicesWithFAQs.mockResolvedValueOnce([
      {
        id: 1,
        name: "居家清潔",
        isPublished: true,
        faqs: [
          { id: 11, question: "可見問題", isVisible: true },
          { id: 12, question: "隱藏問題", isVisible: false },
        ],
      },
      { id: 2, name: "草稿服務", isPublished: false, faqs: [{ id: 21, question: "不應外洩", isVisible: true }] },
    ]);

    await expect(publicCaller.publicContent.services()).resolves.toEqual([
      {
        id: 1,
        name: "居家清潔",
        isPublished: true,
        faqs: [{ id: 11, question: "可見問題", isVisible: true }],
      },
    ]);
  });
});
