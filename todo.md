# 潔特務清潔 CMS 開發進度

## 第一階段：資料庫與後台框架 ✅
- [x] 設計 19 個資料表 Schema
- [x] 建立 RBAC 角色權限系統（6 個角色）
- [x] 建立資料庫查詢函數（50+ 函數）
- [x] 建立 CMS 後台路由（8 個主要功能模組）
- [x] 建立 Dashboard 主頁面元件

## 第二階段：頁面管理功能
- [x] 首頁管理（Hero、標題、副標題、背景圖片/影片）
- [x] 導覽列管理（新增、修改、刪除、排序、下拉選單）
- [x] Footer 管理（地址、電話、Email、社群媒體連結）
- [x] 頁面 SEO 管理（Title、Description、Keywords、Canonical、OG 圖片）

## 第三階段：內容管理功能
- [ ] 服務管理（名稱、介紹、流程、價格、圖片、SEO）
- [ ] 案例管理（標題、地址、施工日期、Before/After 圖片、影片、評論）
- [ ] 文章管理（標題、內容、分類、排程發布、SEO）
- [ ] FAQ 管理（問題、答案、分類、排序、顯示/隱藏）
- [x] 客戶評價管理（姓名、照片、星等、評論、首頁顯示）

## 第四階段：媒體與業務管理
- [ ] 媒體中心（上傳、分類、標籤、搜尋、刪除）
- [x] 預約管理（查看、更新狀態、聯繫客戶）
- [ ] 聯繫表單管理（查看、標記為已讀、回覆）
- [x] 價格管理（基礎價格、每單位價格、優惠）

## CMS 欄位與互動覆蓋
- [ ] 為 Services、Cases、Blogs 與 FAQs 補上欄位級測試或逐欄程式審核，確認需求中的欄位可編輯且正確保存
- [ ] 實作並驗證聯繫管理的回覆工作流程，或將管理範圍明確調整為僅查看與標記已讀
- [x] 為 /cms/prices 補上頁面層角色保護與基礎價格、每單位價格、優惠欄位的互動測試
- [x] 修正 CMSServices 缺少 Hook 匯入、空白編輯按鈕與 admin-only 前端判斷
- [x] 將服務流程、圖片、SEO、發佈狀態與完整價格欄位納入 CMSServices 的新增／編輯表單與測試
- [x] 為服務建立可管理的 FAQ 關聯與公開頁呈現，符合服務管理需求中的服務專屬 FAQ
- [x] 為服務建立真正的 FAQ 關聯模型（例如 service_faqs 關聯表或 FAQ 加上 serviceId），支援多筆問題／答案、排序與顯示控制
- [x] 在 CMS 服務管理或 FAQ 管理頁加入服務專屬 FAQ 的新增、編輯、刪除與排序介面，避免僅用單一自由文字欄位
- [x] 為公開服務頁加入結構化服務 FAQ 呈現與自動化測試，驗證多筆 FAQ、空狀態與未發布內容不外洩
- [x] 新增 CMSFAQ 頁面互動測試，覆蓋服務選擇、排序、顯示開關、編輯與刪除確認流程
- [x] 新增 FAQ API 關聯測試，覆蓋 serviceId 有效性、未發布服務的公開隔離及 FAQ 顯示開關
- [x] 為 CMSFAQs 新增既有 FAQ 編輯互動測試，驗證 question、answer、serviceId、order、isVisible 更新時呼叫 update mutation 並具備成功／失敗回饋

## 預約與聯繫流程可靠性
- [x] 預約狀態輸入採用共用且受限制的列舉驗證
- [x] 預約與聯繫後台顯示明確的更新中與失敗訊息
- [x] 聯繫資料缺少電話或 Email 時維持清楚的空白狀態
- [x] CMSBookings 實際狀態變更操作的 pending/error 頁面互動測試
- [x] CMSContacts 已讀操作的 pending/error 頁面互動測試

## 媒體中心安全上傳
- [x] 受保護的圖片上傳至 S3 與媒體資料庫登錄
- [x] 媒體中心選檔上傳與刪除操作
- [x] 媒體中心檔案格式、大小與權限驗證測試
- [x] 修正 CMSMedia 缺少 React Hook／事件型別匯入，避免媒體頁執行期錯誤
- [x] 增加媒體名稱、分類與替代文字搜尋，以及複選批次上傳流程與測試
- [x] 設計媒體標籤資料模型、標籤篩選與重新命名／替代文字編輯流程

## 第五階段：系統設定與高級功能
- [ ] 網站設定（Logo、公司名稱、聯繫資訊、GA4、Meta Pixel）
- [x] 員工管理（新增、角色分配、停用／啟用）
- [ ] 權限管理（細粒度的角色權限控制）
- [ ] AI 文案生成（FB、IG、LINE、Google 商家貼文）
- [ ] AI 圖片分類與優化

## 使用者與價格 CMS
- [x] 建立 /cms/users 使用者名單、角色調整與帳號停用管理介面
- [x] 限制使用者管理操作僅限 super admin／admin 並補上 API 測試
- [x] 設計可維護的服務價格資料模型與資料庫遷移
- [x] 建立 /cms/prices 價格管理介面，支援服務選擇、最低價、單位價格、優惠與備註
- [x] 將已發布的價格資料安全呈現在公開服務頁，並補上測試
- [x] 為公開 /services 價格展示補上前端測試，涵蓋有價格、無價格與讀取失敗狀態
- [x] 為 /cms/users 補上姓名、Email 與初始／重設密碼的員工資料編輯功能與測試
- [x] 為公開服務價格補上 published-only 資料隔離測試，避免未發布服務或非法價格資料對外輸出

## 使用者資料安全
- [x] 修正 auth.me 僅回傳前端所需的登入者公開欄位，絕不傳送 passwordHash
- [x] 新增 auth.me 序列化測試，避免密碼雜湊或其他敏感欄位再次外洩

## 前端頁面開發
- [x] CMS Dashboard 主頁面 - 統計資訊與快速導航
- [x] Pages 管理頁面
- [x] Services 管理頁面
- [x] Cases 管理頁面
- [x] Blogs 管理頁面
- [x] Bookings 管理頁面
- [x] Contacts 管理頁面
- [x] Media 管理頁面
- [x] Settings 管理頁面
- [x] SEO 管理頁面
- [x] Menus 管理頁面
- [x] FAQs 管理頁面

## 前台動態化
- [x] 首頁內容從資料庫讀取
- [x] 導覽列從資料庫讀取
- [x] 服務頁面動態生成
- [x] 案例頁面動態生成
- [x] 文章頁面動態生成
- [x] FAQ 頁面動態生成
- [x] Footer 內容從資料庫讀取

## 測試與優化
- [ ] 後台功能測試
- [ ] 前台動態化測試
- [ ] 效能優化
- [ ] 安全性檢查
- [ ] SEO 驗證

## SEO 基礎建置
- [x] 建立公開頁 Meta、Canonical 與 Open Graph 動態管理機制
- [x] 明確驗證 LocalBusiness、FAQ 與 Breadcrumb 結構化資料的輸出
- [x] 建立 robots.txt 與 sitemap.xml 並移除未經驗證的結構化資料

## SSR 搜尋可讀性
- [x] 驗證 Header、Footer、SEOHead 與公開頁殼層在無 window/document/localStorage 的伺服器環境可安全渲染
- [x] 建立伺服器端公開路由 HTML 與 CMS SEO 資料輸出
- [ ] 建立用戶端水合與公開資料快取恢復流程
- [x] 驗證公開路由原始 HTML、404 與管理路由 noindex 行為

## CMS 系統設定安全性
- [x] 設定 key 採用白名單與欄位格式驗證
- [x] 設定頁採批次儲存、明確成功或失敗回饋與 admin 權限判斷
- [x] 將 OpenAI、SMTP、Cloudflare 等秘密憑證排除於 CMS 資料庫表單
- [x] 為 CMS 設定每個白名單 key 加入對應格式驗證（Email、URL、GA4、Meta Pixel、電話）
- [x] 在設定讀取 API 過濾敏感設定 keys，避免任何秘密值回傳至前端
- [x] 補上 CMS Settings 儲存成功／失敗提示與設定安全性的自動化測試
- [x] 公開頁初始 HTML 依 CMS 設定安全注入 GA4 與 Meta Pixel 追蹤碼
- [x] 為 CMS Settings 新增自動化測試，覆蓋合法／非法 Email、URL、GA4、Meta Pixel 與電話輸入
- [ ] 確認敏感設定僅可透過伺服器端安全管道管理，CMS 表單與設定讀取 API 僅回傳白名單鍵
- [x] 新增 CMSSettings 頁面測試，覆蓋批次儲存成功與失敗時的回饋訊息
- [x] 新增 settings API 測試，驗證敏感鍵不會被 list/get/update/updateBatch 讀取或寫入
- [x] 驗證 CMSSettings 批次儲存失敗時保留使用者輸入，且不誤顯示成功提示

## 部署與發佈
- [ ] 最終檢查
- [ ] 部署到生產環境
- [ ] 監控與維護

## 前台功能優化
- [x] 右側浮動選單（LINE、Facebook、電話、信箱）
- [x] 首頁 Hero 區塊動態化
- [x] Footer 動態化
- [x] 導覽列動態化
- [x] CMS 選單新視窗欄位與公開導覽同步
- [x] 修正 CMS 選單頁與既有 RBAC 角色的權限判斷一致性
- [x] 驗證 CMS 選單的新視窗設定會套用至內部與外部公開導覽連結
- [x] 以實際管理員會話驗證 CMSMenus 後端列表 API 與資料讀取
- [ ] 以實際管理員登入後開啟 /cms/menus，驗證頁面可載入且選單資料實際顯示
- [x] 為 Header 導覽連結建立元件層新視窗屬性測試

## 認證與授權
- [x] Header 登入/登出按鈕
- [x] RBAC 權限系統實現
- [x] Debug 頁面（/admin/debug）
- [x] CMS 後台權限檢查
- [ ] 前台內容權限控制
- [x] 匿名驗證已發布 auth.me 不回傳使用者敏感資料，且 CMS 路由初始 HTML 採 noindex
- [ ] 以授權管理員已登入會話驗證 /cms、/cms/prices 與 /cms/users 的讀取、儲存及角色保護操作

## CMS 後台恢復
- [x] 盤點並恢復 CMS Dashboard、管理頁面與路由
- [x] 建立受保護的管理員登入與登出流程
- [x] 驗證管理員權限與 CMS 存取控制
- [x] 測試 Dashboard 與內容管理主要流程
