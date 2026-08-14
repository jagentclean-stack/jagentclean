import { describe, expect, it } from "vitest";
import { getNewWindowLinkProps } from "./navigation";

describe("CMS 導覽新視窗設定", () => {
  it("啟用時會輸出安全的新視窗屬性", () => {
    expect(getNewWindowLinkProps(true)).toEqual({ target: "_blank", rel: "noopener noreferrer" });
  });

  it("關閉或未設定時不會輸出新視窗屬性", () => {
    expect(getNewWindowLinkProps(false)).toEqual({});
    expect(getNewWindowLinkProps(null)).toEqual({});
  });
});
