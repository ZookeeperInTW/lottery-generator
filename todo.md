> 最後更新：2026-06-29

## 已完成

- [x] 建立 Next.js 16 + TypeScript + Tailwind 專案架構
- [x] PWA 設定（manifest.json、Service Worker、SW 自動註冊）
- [x] 核心抽號邏輯 (`lib/lottery.ts`)：隨機 6 球不重複於歷史紀錄
- [x] 主頁 UI：號碼球動畫、一鍵選號、近期產生紀錄
- [x] 歷史開獎紀錄頁面（含搜尋功能）
- [x] localStorage 持久化（歷史資料 + 產生記錄）
- [x] 自選號碼查詢功能
- [x] 接入 Supabase，匯入 2147 筆歷史開獎資料
- [x] API route 自動從台彩官方 API 同步最新資料並 upsert Supabase
- [x] 前端增量更新：只拉比本地快取更新的資料
- [x] Vercel 函式逾時延長至 60 秒（vercel.json）
- [x] 部署至 Vercel

## 待完成

- [ ] 補充離線提示 UI
- [ ] 分析統計功能（熱號冷號圖表）

## 已知問題 / Backlog

- Supabase 免費版 1 週無活動會自動暫停，需定期保持活躍或升級方案
- 目前僅支援大樂透，可擴充威力彩、今彩539
