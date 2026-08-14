import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getSettingsByKeys: vi.fn(async () => [
    { key: "site_name", value: "潔特務清潔" },
    { key: "contact_image_url", value: "/manus-storage/contact-team.webp" },
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
    await expect(caller.settings.list()).resolves.toEqual([
      { key: "site_name", value: "潔特務清潔" },
      { key: "contact_image_url", value: "/manus-storage/contact-team.webp" },
    ]);
  });

  it("get、update 與 updateBatch 會在輸入驗證階段拒絕敏感鍵", async () => {
    await expect(caller.settings.get({ key: "smtp_password" } as never)).rejects.toThrow();
    await expect(caller.settings.update({ key: "openai_api_key", value: "secret" } as never)).rejects.toThrow();
    await expect(caller.settings.updateBatch({ settings: { cloudflare_api_token: "secret" } } as never)).rejects.toThrow();
    expect(dbMock.updateSetting).not.toHaveBeenCalled();
  });

  it("公開網站設定只輸出白名單品牌與聯繫欄位，絕不輸出敏感設定", async () => {
    const settings = await caller.publicContent.siteSettings();
    expect(settings).toMatchObject({
      siteName: "潔特務清潔",
      logoUrl: null,
      contactImageUrl: "/manus-storage/contact-team.webp",
      companyPhone: "",
      lineUrl: "",
      facebookUrl: "",
    });
    expect(settings).not.toHaveProperty("smtp_password");
    expect(settings).not.toHaveProperty("openai_api_key");
  });

  it("公開網站設定缺值時維持空白，不回退至硬編碼品牌或聯繫資料", async () => {
    dbMock.getSettingsByKeys.mockResolvedValueOnce([]);
    await expect(caller.publicContent.siteSettings()).resolves.toMatchObject({
      siteName: "",
      siteDescription: "",
      logoUrl: null,
      companyPhone: "",
      companyEmail: "",
      lineUrl: "",
      companyAddress: "",
    });
  });
});
