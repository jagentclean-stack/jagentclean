import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AsyncFeedback } from "./AsyncFeedback";

describe("AsyncFeedback", () => {
  it("在非同步操作進行中顯示可被輔助技術讀取的更新狀態", () => {
    const html = renderToStaticMarkup(<AsyncFeedback isPending pendingLabel="正在更新預約狀態…" />);
    expect(html).toContain('role="status"');
    expect(html).toContain("正在更新預約狀態…");
  });

  it("在操作失敗時顯示明確的錯誤提示", () => {
    const html = renderToStaticMarkup(<AsyncFeedback isPending={false} pendingLabel="更新中" errorMessage="無法更新，請稍後再試。" />);
    expect(html).toContain('role="alert"');
    expect(html).toContain("無法更新，請稍後再試。");
  });
});
