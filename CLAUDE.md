# Stock Tracker 專案規則

## 開發前同步規則
每次開始開發 **之前**，**必須**：
1. 執行 `git pull` 同步 GitHub 最新程式碼
2. 檢查是否有衝突，若有衝突則解決後再開始
3. 確認本地與遠端分支一致後才開始開發

## 自動 Git 流程
每次修改程式碼完成後，**不需要使用者另外要求**，自動執行：
1. `npm test` — 確認所有測試通過，才能繼續
2. `git add -A`
3. `git commit -m "適當的 commit 訊息"`
4. `git push`

commit 訊息用英文，格式：`feat:` / `fix:` / `chore:` 開頭。

## 部署驗證規則
每次 `git push` 後，**必須確認 Vercel 部署成功**：
1. 執行 `npx vercel ls` 確認最新部署狀態
2. 若狀態為 `● Error`：立即執行 `npx next build` 找出錯誤原因並修正
3. 重複修正 → push → 確認，**直到狀態變為 `● Ready` 為止**
4. 不得在部署失敗的狀態下結束任務，避免使用者看到錯誤版本

## Design 規則
每次實作 UI 相關功能前，**必須先讀取 `design.md`**，並遵守以下規範：
- 色彩：以 `design.md` 定義的色票為準，不自行發明顏色
- 字型：Display 用 Kraken-Brand，UI/Body 用 Kraken-Product（IBM Plex Sans fallback）
- 按鈕：radius 12px，不使用 pill（9999px）樣式
- 間距 / 圓角：從 `design.md` Section 5 的允許值中選取
- 若設計稿與現有程式碼衝突，主動告知使用者並等待確認

## todo.md 更新規則
每次新增、修改、刪除功能後，**不需要使用者另外要求**，自動更新 `todo.md`：
- 新完成的功能：從「待完成」移至「已完成」（或直接加入已完成區塊）
- 新發現的問題或待辦：加入「已知問題 / Backlog」
- 更新日期（`> 最後更新：YYYY-MM-DD`）
- 更新時機：在 `git commit` 之前完成，並一併納入同一個 commit

## requirements.md 更新規則
每次新增、修改、刪除功能後，**不需要使用者另外要求**，同步更新 `requirements.md`：
- 新功能 → 加入對應章節（頁面需求 / API 規格 / 資料模型）
- 行為變更 → 更新對應需求條目
- 功能移除 → 從文件刪除或移至「已知限制」
- 更新時機：與 `todo.md` 同一個 commit

## 測試規則
- 每次新增、修改、刪除功能，**必須同步更新測試**
- 測試覆蓋率門檻：statements 90%、branches 85%、functions 90%、lines 90%
- 測試指令：`npm test`（單次執行）、`npm run test:coverage`（含覆蓋率報告）
- 所有測試位於 `src/**/__tests__/` 目錄
- **禁止在測試未通過的情況下 push**
