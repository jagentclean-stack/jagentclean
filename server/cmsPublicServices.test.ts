import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getPublishedServices: vi.fn(async () => [
    { id: 1, title: "公開服務", isPublished: true, minPrice: "1200", pricePerUnit: "300" },
    { id: 2, title: "未發布服務", isPublished: false, minPrice: "9999", pricePerUnit: "999" },
  ]),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter, onlyPublishedServices } from "./cms";

describe("公開服務與價格隔離", () => {
  it("只保留已發布服務", () => {
    expect(onlyPublishedServices([
      { id: 1, isPublished: true },
      { id: 2, isPublished: false },
    ])).toEqual([{ id: 1, isPublished: true }]);
  });

  it("public services API 不輸出未發布服務的價格資料", async () => {
    const caller = cmsRouter.createCaller({ req: {} as never, res: {} as never, user: null });
    await expect(caller.publicContent.services()).resolves.toEqual([
      { id: 1, title: "公開服務", isPublished: true, minPrice: "1200", pricePerUnit: "300" },
    ]);
  });
});
