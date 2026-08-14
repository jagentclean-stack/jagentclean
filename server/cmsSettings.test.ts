import { describe, expect, it } from "vitest";
import { cmsSettingKeySchema, filterCmsSettingsForClient, validateCmsSettingValue } from "./cms";

describe("CMS 設定輸入驗證", () => {
  it("接受合法的 Email、URL、GA4、Meta Pixel 與電話設定", () => {
    expect(() => validateCmsSettingValue("company_email", "jagentclean@gmail.com")).not.toThrow();
    expect(() => validateCmsSettingValue("facebook_url", "https://www.facebook.com/Jagentclean")).not.toThrow();
    expect(() => validateCmsSettingValue("ga_id", "G-ABC12345")).not.toThrow();
    expect(() => validateCmsSettingValue("meta_pixel_id", "1234567890")).not.toThrow();
    expect(() => validateCmsSettingValue("company_phone", "06-3584567")).not.toThrow();
  });

  it("拒絕格式錯誤的敏感分析與聯絡設定", () => {
    expect(() => validateCmsSettingValue("company_email", "not-an-email")).toThrow();
    expect(() => validateCmsSettingValue("facebook_url", "not-a-url")).toThrow();
    expect(() => validateCmsSettingValue("ga_id", "UA-123")).toThrow();
    expect(() => validateCmsSettingValue("meta_pixel_id", "abc")).toThrow();
    expect(() => validateCmsSettingValue("company_phone", "invalid phone")).toThrow();
  });

  it("僅接受白名單鍵並過濾可能含有秘密值的設定", () => {
    expect(cmsSettingKeySchema.safeParse("site_name").success).toBe(true);
    expect(cmsSettingKeySchema.safeParse("smtp_password").success).toBe(false);
    expect(cmsSettingKeySchema.safeParse("openai_api_key").success).toBe(false);

    const safeSettings = filterCmsSettingsForClient([
      { key: "site_name", value: "潔特務清潔" },
      { key: "smtp_password", value: "should-not-leak" },
      { key: "ga_id", value: "G-ABC12345" },
    ]);
    expect(safeSettings).toEqual([
      { key: "site_name", value: "潔特務清潔" },
      { key: "ga_id", value: "G-ABC12345" },
    ]);
  });
});
