import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getAllCases: vi.fn(async () => []),
  getCaseBySlug: vi.fn(async () => undefined),
  createCase: vi.fn(async () => ({ success: true })),
  updateCase: vi.fn(async () => ({ success: true })),
  deleteCase: vi.fn(async () => ({ success: true })),
}));

vi.mock("./db", () => dbMock);
vi.mock("./adminAuth", () => ({ hashCmsUserPassword: vi.fn(async () => "scrypt$test$hash") }));

import { cmsRouter } from "./cms";

const createCaller = (role: string, email: string) => cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 99, openId: "caller", name: "Caller", email, role, isActive: true } as never,
});

describe("CMS cases router", () => {
  it("允許 editor 建立完整案例欄位，並使用資料表正式欄位名稱", async () => {
    await expect(createCaller("editor", "editor@example.com").cases.create({
      title: "浴室除霉",
      slug: "bathroom-mold-removal",
      address: "台南市安南區",
      serviceId: 2,
      constructionDate: new Date("2026-08-12T00:00:00.000Z"),
      constructionTime: "4 小時",
      beforeImages: ["/manus-storage/before.webp"],
      afterImages: ["/manus-storage/after.webp"],
      video: "https://youtu.be/example",
      testimonial: "施工完成後煥然一新。",
      googleReview: "https://g.page/r/example/review",
      tags: ["浴室", "除霉"],
      categoryId: 4,
      order: 2,
      isPublished: true,
    })).resolves.toEqual({ success: true });
    expect(dbMock.createCase).toHaveBeenCalledWith(expect.objectContaining({
      title: "浴室除霉",
      address: "台南市安南區",
      beforeImages: ["/manus-storage/before.webp"],
      afterImages: ["/manus-storage/after.webp"],
      tags: ["浴室", "除霉"],
      isPublished: true,
    }));
  });

  it("允許 super_admin 更新發布狀態，並拒絕舊版錯誤欄位", async () => {
    await expect(createCaller("super_admin", "owner@example.com").cases.update({
      id: 3,
      title: "修訂案例",
      isPublished: false,
      order: 6,
    })).resolves.toEqual({ success: true });
    expect(dbMock.updateCase).toHaveBeenCalledWith(3, { title: "修訂案例", isPublished: false, order: 6 });
    await expect(createCaller("editor", "editor@example.com").cases.create({
      name: "舊欄位名稱",
      slug: "old-field",
    } as never)).rejects.toThrow();
  });

  it("拒絕未授權角色讀取或刪除案例", async () => {
    await expect(createCaller("customer_service", "service@example.com").cases.list()).rejects.toThrow("Unauthorized");
    await expect(createCaller("editor", "editor@example.com").cases.delete({ id: 3 })).rejects.toThrow("Unauthorized");
  });
});
