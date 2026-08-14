import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  updateService: vi.fn(async () => ({ success: true })),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter } from "./cms";

const caller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 1, email: "jagentclean@gmail.com", role: "admin" } as never,
});

describe("CMS 服務價格管理", () => {
  it("接受有效的價格、優惠訊息與報價備註，且將空白價格轉為 null", async () => {
    await expect(caller.services.update({
      id: 7,
      basePrice: "",
      pricePerUnit: "500.50",
      unit: "坪",
      promotion: "首次預約優惠",
      priceNote: "實際費用依現場狀況確認。",
      isPublished: true,
    })).resolves.toEqual({ success: true });

    expect(dbMock.updateService).toHaveBeenCalledWith(7, expect.objectContaining({
      basePrice: null,
      pricePerUnit: "500.50",
      promotion: "首次預約優惠",
      priceNote: "實際費用依現場狀況確認。",
    }));
  });

  it("拒絕負數、超過兩位小數與超長優惠訊息", async () => {
    await expect(caller.services.update({ id: 7, basePrice: "-100" } as never)).rejects.toThrow();
    await expect(caller.services.update({ id: 7, pricePerUnit: "100.123" } as never)).rejects.toThrow();
    await expect(caller.services.update({ id: 7, promotion: "a".repeat(256) } as never)).rejects.toThrow();
  });
});
