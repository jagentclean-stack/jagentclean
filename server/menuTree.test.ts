import { describe, expect, it } from "vitest";
import { buildMenuTree } from "./menuTree";

describe("公開選單樹", () => {
  it("依父層與排序欄位建立穩定的階層選單", () => {
    const result = buildMenuTree([
      { id: 3, parentId: 1, order: 2, label: "子項目二" },
      { id: 2, parentId: null, order: 2, label: "關於我們" },
      { id: 1, parentId: null, order: 1, label: "服務" },
      { id: 4, parentId: 1, order: 1, label: "子項目一" },
    ]);

    expect(result.map((item) => item.label)).toEqual(["服務", "關於我們"]);
    expect(result[0].children.map((item) => item.label)).toEqual(["子項目一", "子項目二"]);
  });

  it("將指向不存在父層的項目保留為可存取根選單", () => {
    const result = buildMenuTree([{ id: 5, parentId: 99, order: 0, label: "獨立連結" }]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("獨立連結");
  });
});
