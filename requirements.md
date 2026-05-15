# 大樂透號碼產生器 需求文件

> 版本：1.0.0 | 最後更新：2026-05-15

## 1. 產品概述

一個 PWA Web App，讓使用者隨機產生大樂透號碼，且保證所產生的組合不與任何歷史開獎紀錄重複。

## 2. 功能需求

### 2.1 主頁（`/`）

| 功能 | 描述 |
|------|------|
| 更新資料 | 從台彩官方網站抓取最新開獎紀錄，存入 localStorage |
| 隨機選號 | 產生 6 個 1–49 的不重複號碼，確保組合不存在於歷史資料 |
| 號碼球動畫 | 每次產生後球體依序彈出動畫 |
| 近期產生紀錄 | 顯示最近 5 次產生結果（最多保留 20 筆） |
| 離線可用 | Service Worker 快取靜態資源，localStorage 保存資料 |

### 2.2 歷史紀錄頁（`/history`）

| 功能 | 描述 |
|------|------|
| 顯示所有紀錄 | 以表格呈現期號、日期、6 個號碼、特別號 |
| 搜尋 | 可依期號或號碼篩選 |
| 號碼顏色 | 1–10 紅、11–20 橙、21–30 青、31–40 藍、41–49 紫 |

## 3. API 規格

### `GET /api/lottery-history`

**Response：**
```json
{
  "success": true,
  "count": 500,
  "lastUpdated": "2026-05-15T00:00:00.000Z",
  "records": [
    {
      "drawNum": "114000045",
      "drawDate": "2026-05-14",
      "numbers": [3, 12, 24, 33, 41, 47],
      "special": 19
    }
  ]
}
```

**資料來源：** 台彩官方網站 HTML 解析（分頁抓取，最多 5 頁 / ~500 筆）

## 4. 資料模型

### `DrawRecord`
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
  id: string;         // timestamp string
  numbers: number[];  // 6 個已排序號碼
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
| 資料持久化 | localStorage |
| 部署 | Vercel |

## 6. 已知限制

- 台彩官網 HTML 結構若改版，解析邏輯需更新
- 目前僅支援大樂透（1–49 選 6）
- 歷史資料限最近 ~500 筆（5 頁），非全部歷史
