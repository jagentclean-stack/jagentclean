# 清潔知識文章詳情頁驗證紀錄

驗證日期：2026-08-16

## 視覺驗證

已在桌面版檢查 `/blog` 與 `/blog/cleaning-products-safety-guide`。清潔知識列表顯示十篇已發布文章與「閱讀全文」入口；文章詳情頁顯示返回列表連結、文章標題、摘要、發布日期、完整內文與 LINE 諮詢 CTA，並沿用既有 Header 與 Footer。

## 自動化驗證

- 公開文章單篇查詢僅回傳已發布且已到排程時間的內容；草稿或不存在的 slug 以未找到處理。
- 文章詳情在伺服器端輸出 Canonical、Open Graph `article`、Article JSON-LD 與三層 Breadcrumb JSON-LD。
- 未發布或不存在文章不列為公開索引路由，回應採用 `noindex, nofollow`。
- 完整 Vitest 回歸套件與正式 Vite 建置均已通過。
