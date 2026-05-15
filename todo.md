> 最後更新：2026-05-15

## 已完成

- [x] 建立 Next.js 16 + TypeScript + Tailwind 專案架構
- [x] PWA 設定（manifest.json、Service Worker、SW 自動註冊）
- [x] 台彩大樂透歷史開獎資料 API route (`/api/lottery-history`)
- [x] 核心抽號邏輯 (`lib/lottery.ts`)：隨機 6 球不重複於歷史紀錄
- [x] 主頁 UI：號碼球動畫、一鍵選號、近期產生紀錄
- [x] 歷史開獎紀錄頁面（含搜尋功能）
- [x] localStorage 持久化（歷史資料 + 產生記錄）

## 待完成

- [ ] PWA 圖示（192x192, 512x512）
- [ ] 部署至 Vercel
- [ ] 補充離線提示 UI
- [ ] 分析統計功能（熱號冷號圖表）

## 已知問題 / Backlog

- 台彩官網 HTML 結構若改版，API route 解析需同步更新
- 目前僅支援大樂透，可擴充威力彩、今彩539
