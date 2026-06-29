# 大樂透號碼產生器 需求文件

> 版本：1.1.0 | 最後更新：2026-06-29

## 1. 產品概述

一個 PWA Web App，讓使用者隨機產生大樂透號碼，且保證所產生的組合不與任何歷史開獎紀錄重複。

## 2. 功能需求

### 2.1 主頁（`/`）

| 功能 | 描述 |
|------|------|
| 更新資料 | 自動從台彩官方 API 同步最新開獎紀錄至 Supabase，前端只拉增量 |
| 隨機選號 | 產生 6 個 1–49 的不重複號碼，確保組合不存在於歷史資料 |
| 號碼球動畫 | 每次產生後球體依序彈出動畫 |
| 近期產生紀錄 | 顯示最近 5 次產生結果（最多保留 20 筆） |
| 自選查詢 | 輸入自選號碼，查詢是否曾在歷史開獎中出現 |
| 離線可用 | Service Worker 快取靜態資源，localStorage 保存資料 |

### 2.2 歷史紀錄頁（`/history`）

| 功能 | 描述 |
|------|------|
| 顯示所有紀錄 | 以表格呈現期號、日期、6 個號碼、特別號 |
| 搜尋 | 可依期號或號碼篩選 |
| 號碼顏色 | 1–10 紅、11–20 橙、21–30 青、31–40 藍、41–49 紫 |

## 3. API 規格

### `GET /api/lottery-history`

**Query 參數：**
| 參數 | 說明 |
|------|------|
| `after` | 選填。日期格式 `YYYY-MM-DD`，只回傳比此日期更新的紀錄（增量更新用） |

**行為：**
1. 查 Supabase 最新期日期
2. 從該月起呼叫台彩官方 API，取得最新資料並 upsert 進 Supabase
3. 依 `after` 參數回傳增量或全量資料

**Response：**
```json
{
  "success": true,
  "count": 8,
  "lastUpdated": "2026-06-29T00:00:00.000Z",
  "records": [
    {
      "drawNum": "114000045",
      "drawDate": "2026-06-26",
      "numbers": [3, 12, 24, 33, 41, 47],
      "special": 19
    }
  ]
}
```

**資料來源：** 台彩官方 API `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result`

## 4. 資料模型

### Supabase `draw_records` 資料表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `draw_num` | TEXT (PK) | 期號 |
| `draw_date` | DATE | 開獎日期 |
| `n1`–`n6` | INTEGER | 6 個號碼 |
| `special` | INTEGER | 特別號 |

### `DrawRecord`（前端型別）
```typescript
{
  drawDate: string;   // "YYYY-MM-DD"
  drawNum: string;    // 期號
  numbers: number[];  // 6 個號碼，已升序排列
  special: number;    // 特別號
}
```

### `GeneratedEntry`
```typescript
{
  id: string;          // timestamp string
  numbers: number[];   // 6 個已排序號碼
  generatedAt: string; // ISO 8601
}
```

## 5. 技術架構

| 層 | 技術 |
|----|------|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 樣式 | Tailwind CSS v4 |
| 語言 | TypeScript |
| PWA | 手動 Service Worker + manifest.json |
| 資料庫 | Supabase (PostgreSQL) |
| 資料持久化 | localStorage（快取） |
| 部署 | Vercel（函式逾時 60 秒） |

## 6. 環境變數

| 變數名稱 | 說明 |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

## 7. 已知限制

- Supabase 免費版 1 週無活動會自動暫停
- 目前僅支援大樂透（1–49 選 6）
