import { describe, expect, it, vi } from "vitest";

const publishedBlog = {
  id: 12,
  title: "沙發多久洗一次？",
  slug: "how-often-to-clean-sofa",
  excerpt: "居家沙發深層清潔建議。",
  content: "完整文章內容",
  isPublished: true,
  scheduledAt: null,
  publishedAt: new Date("2026-08-16T00:00:00.000Z"),
};

const dbMock = vi.hoisted(() => ({
  getPublishedBlogs: vi.fn(async () => []),
  getPublishedBlogBySlug: vi.fn(async () => undefined),
  getAllCmsRolePermissionOverrides: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);
vi.mock("./adminAuth", () => ({ hashCmsUserPassword: vi.fn(async () => "scrypt$test$hash") }));

import { cmsRouter } from "./cms";

const publicCaller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: null,
});

describe("CMS 公開文章詳情", () => {
  it("僅以已發布查詢取得指定 slug 的完整文章", async () => {
    dbMock.getPublishedBlogBySlug.mockResolvedValueOnce(publishedBlog);

    await expect(publicCaller.publicContent.blogBySlug({ slug: publishedBlog.slug })).resolves.toEqual(publishedBlog);
    expect(dbMock.getPublishedBlogBySlug).toHaveBeenCalledWith(publishedBlog.slug);
  });

  it("未發布、排程未到或不存在的文章一律以 404 回應", async () => {
    dbMock.getPublishedBlogBySlug.mockResolvedValueOnce(undefined);

    await expect(publicCaller.publicContent.blogBySlug({ slug: "private-draft" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
