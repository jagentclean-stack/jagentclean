import { describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => ({
  getSettingsByKeys: vi.fn(async () => [
    { key: "site_name", value: "潔特務清潔" },
    { key: "contact_image_url", value: "/manus-storage/contact-team.webp" },
    { key: "smtp_password", value: "must-not-leak" },
  ]),
  updateSetting: vi.fn(async () => ({ success: true })),
  getFooter: vi.fn(async () => ({ id: 7 })),
  updateFooter: vi.fn(async () => ({ success: true })),
  getAllCmsRolePermissionOverrides: vi.fn(async () => []),
}));

vi.mock("./db", () => dbMock);

import { cmsRouter, CMS_SENSITIVE_SETTING_KEYS, filterCmsSettingsForClient } from "./cms";

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
    for (const key of CMS_SENSITIVE_SETTING_KEYS) {
      await expect(caller.settings.get({ key } as never)).rejects.toThrow();
      await expect(caller.settings.update({ key, value: "secret" } as never)).rejects.toThrow();
      await expect(caller.settings.updateBatch({ settings: { [key]: "secret" } } as never)).rejects.toThrow();
    }
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
    for (const key of CMS_SENSITIVE_SETTING_KEYS) expect(settings).not.toHaveProperty(key);
  });

  it("客戶端設定過濾器會隔離所有列管的敏感鍵", () => {
    const filtered = filterCmsSettingsForClient([
      { key: "site_name", value: "潔特務清潔" },
      ...CMS_SENSITIVE_SETTING_KEYS.map((key) => ({ key, value: "must-not-leak" })),
    ]);
    expect(filtered).toEqual([{ key: "site_name", value: "潔特務清潔" }]);
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

  it("儲存網站設定時會同步重疊的公開頁尾欄位，避免兩個後台入口資料分歧", async () => {
    await caller.settings.updateBatch({
      settings: {
        site_name: "潔特務清潔",
        site_description: "",
        logo_url: "",
        contact_image_url: "",
        company_address: "台南市安南區國安街45巷12號",
        company_phone: "06-3584567",
        company_fax: "",
        company_email: "jagentclean@gmail.com",
        line_id: "",
        line_url: "",
        facebook_url: "",
        instagram_url: "",
        google_map_embed: "",
        google_map_url: "",
        ga_id: "",
        meta_pixel_id: "",
        copyright_text: "© 2026 潔特務清潔 J-Agent Cleaning. All rights reserved.",
      },
    });

    expect(dbMock.updateFooter).toHaveBeenCalledWith(7, {
      address: "台南市安南區國安街45巷12號",
      phone: "06-3584567",
      email: "jagentclean@gmail.com",
      copyrightText: "© 2026 潔特務清潔 J-Agent Cleaning. All rights reserved.",
    });
  });

  it("頁尾管理更新版權時會回寫公開網站設定，讓前台使用同一份資料", async () => {
    await caller.footer.update({
      id: 7,
      copyrightText: "© 2027 潔特務清潔 J-Agent Cleaning. All rights reserved.",
    });

    expect(dbMock.updateSetting).toHaveBeenCalledWith(
      "copyright_text",
      "© 2027 潔特務清潔 J-Agent Cleaning. All rights reserved.",
    );
  });
});
