import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getSettingsByKeys: vi.fn(async () => [
    { key: "site_name", value: "潔特務清潔" },
    { key: "smtp_password", value: "must-not-leak" },
  ]),
  updateSetting: vi.fn(async () => ({ success: true })),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter } from "./cms";

const caller = cmsRouter.createCaller({
  req: {} as never,
  res: {} as never,
  user: { id: 1, email: "jagentclean@gmail.com", role: "admin" } as never,
});

describe("CMS settings router 白名單隔離", () => {
  it("list 只回傳白名單設定，即使資料層含有敏感鍵", async () => {
    await expect(caller.settings.list()).resolves.toEqual([{ key: "site_name", value: "潔特務清潔" }]);
  });

  it("get、update 與 updateBatch 會在輸入驗證階段拒絕敏感鍵", async () => {
    await expect(caller.settings.get({ key: "smtp_password" } as never)).rejects.toThrow();
    await expect(caller.settings.update({ key: "openai_api_key", value: "secret" } as never)).rejects.toThrow();
    await expect(caller.settings.updateBatch({ settings: { cloudflare_api_token: "secret" } } as never)).rejects.toThrow();
    expect(dbMock.updateSetting).not.toHaveBeenCalled();
  });
});
