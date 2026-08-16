import { describe, expect, it } from "vitest";
import { articleTextBlocks } from "./articleContent";

describe("articleTextBlocks", () => {
  it("保留文章段落與常見 HTML 實體，同時移除 HTML 標籤", () => {
    expect(articleTextBlocks("<p>第一段&nbsp;內容</p><p>第二段 &amp; 清潔</p>")).toEqual([
      "第一段 內容",
      "第二段 & 清潔",
    ]);
  });

  it("不會把 CMS 內容中的可執行標籤交給瀏覽器解析", () => {
    expect(articleTextBlocks("安全內容<script>alert('xss')</script><img src=x onerror=alert(1)>")).toEqual([
      "安全內容alert('xss')",
    ]);
  });
});
