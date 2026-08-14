import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getAllBlogs: vi.fn(async () => []),
  getBlogBySlug: vi.fn(async () => undefined),
  createBlog: vi.fn(async () => ({ success: true })),
  updateBlog: vi.fn(async () => ({ success: true })),
  deleteBlog: vi.fn(async () => ({ success: true })),
  getCategoriesByType: vi.fn(async () => []),
  getAllCategories: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);
vi.mock("./adminAuth", () => ({ hashCmsUserPassword: vi.fn(async () => "scrypt$test$hash") }));

import { cmsRouter } from "./cms";

const createCaller = (role: string, email: string) => cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 99, openId: "caller", name: "Caller", email, role, isActive: true } as never,
});

describe("CMS blogs router", () => {
  it("允許 super_admin 建立包含封面、分類、排程與 SEO 的完整文章", async () => {
    await expect(createCaller("super_admin", "owner@example.com").blogs.create({
      title: "浴室清潔的最佳實踐",
      slug: "bathroom-cleaning-best-practices",
      excerpt: "讓浴室維持潔淨的實用技巧。",
      content: "完整文章內容",
      featuredImage: "/manus-storage/bathroom-cover.webp",
      categoryId: 4,
      isPublished: true,
      publishedAt: new Date("2026-08-12T08:00:00.000Z"),
      scheduledAt: new Date("2026-08-15T08:00:00.000Z"),
      seoTitle: "浴室清潔完整指南",
      seoDescription: "專業浴室清潔與除霉方法。",
      seoKeywords: "浴室清潔,除霉,台南清潔",
    })).resolves.toEqual({ success: true });

    expect(dbMock.createBlog).toHaveBeenCalledWith(expect.objectContaining({
      title: "浴室清潔的最佳實踐",
      featuredImage: "/manus-storage/bathroom-cover.webp",
      categoryId: 4,
      authorId: 99,
      isPublished: true,
      seoTitle: "浴室清潔完整指南",
      scheduledAt: expect.any(Date),
    }));
  });

  it("允許 marketing 編輯文章與排程資料，但不允許刪除", async () => {
    await expect(createCaller("marketing", "marketing@example.com").blogs.update({
      id: 7,
      title: "修訂文章",
      isPublished: false,
      scheduledAt: new Date("2026-08-20T08:00:00.000Z"),
      seoDescription: "修訂後的 SEO 描述",
    })).resolves.toEqual({ success: true });
    expect(dbMock.updateBlog).toHaveBeenCalledWith(7, expect.objectContaining({
      title: "修訂文章",
      isPublished: false,
      seoDescription: "修訂後的 SEO 描述",
    }));
    await expect(createCaller("marketing", "marketing@example.com").blogs.delete({ id: 7 })).rejects.toThrow("Unauthorized");
  });

  it("允許內容角色取得文章分類，並拒絕客服讀取文章", async () => {
    await expect(createCaller("editor", "editor@example.com").categories.list({ type: "blog" })).resolves.toEqual([]);
    expect(dbMock.getCategoriesByType).toHaveBeenCalledWith("blog");
    await expect(createCaller("customer_service", "service@example.com").blogs.list()).rejects.toThrow("Unauthorized");
  });
});
