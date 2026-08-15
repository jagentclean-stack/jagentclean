import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  media: undefined as undefined | { id: number; filename: string; url: string; type: "image" | "video"; mimeType: string },
  analyze: vi.fn(async () => ({ suggestedCategory: "案例", suggestedAltText: "清潔作業畫面", suggestedFilename: "cleaning-case.webp", confidence: "high" as const, reasoning: "圖片內容為清潔服務。" })),
}));

const dbMock = vi.hoisted(() => ({
  getMediaById: vi.fn(async () => state.media),
  updateMedia: vi.fn(async () => ({ success: true })),
  getAllCmsRolePermissionOverrides: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);
vi.mock("./cmsMediaAnalysis", () => ({ analyzeCmsMediaImage: state.analyze }));
vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(async () => "https://cdn.example.test/image.webp"), storagePut: vi.fn() }));
vi.mock("./adminAuth", () => ({ hashCmsUserPassword: vi.fn(async () => "test-hash") }));

import { cmsRouter } from "./cms";

const createCaller = (role: string, email = "tester@example.com") => cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 20, openId: "cms-media-route", name: "Tester", email, role, isActive: true } as never,
});

beforeEach(() => {
  state.media = undefined;
  state.analyze.mockClear();
  dbMock.getMediaById.mockClear();
  dbMock.updateMedia.mockClear();
});

describe("cms.media.analyzeImage", () => {
  it("拒絕未獲授權角色使用圖片分析", async () => {
    await expect(createCaller("employee").media.analyzeImage({ mediaId: 1 }))
      .rejects.toThrow("您沒有 AI 圖片分析功能的使用權限");
    expect(dbMock.getMediaById).not.toHaveBeenCalled();
  });

  it("拒絕不存在或非圖片的媒體檔案", async () => {
    await expect(createCaller("super_admin").media.analyzeImage({ mediaId: 1 }))
      .rejects.toThrow("找不到指定媒體檔案");

    state.media = { id: 2, filename: "work.mp4", url: "https://cdn.example.test/work.mp4", type: "video", mimeType: "video/mp4" };
    await expect(createCaller("super_admin").media.analyzeImage({ mediaId: 2 }))
      .rejects.toThrow("僅能分析圖片格式的媒體檔案");
    expect(state.analyze).not.toHaveBeenCalled();
  });

  it("僅回傳 AI 草稿，不會自行更新媒體中繼資料", async () => {
    state.media = { id: 3, filename: "cleaning.webp", url: "https://cdn.example.test/cleaning.webp", type: "image", mimeType: "image/webp" };
    await expect(createCaller("super_admin").media.analyzeImage({ mediaId: 3 })).resolves.toMatchObject({
      suggestedFilename: "cleaning-case.webp",
      suggestedAltText: "清潔作業畫面",
    });
    expect(state.analyze).toHaveBeenCalledWith(expect.objectContaining({ filename: "cleaning.webp", mimeType: "image/webp" }));
    expect(dbMock.updateMedia).not.toHaveBeenCalled();
  });
});
