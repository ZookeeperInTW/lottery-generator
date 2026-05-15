/**
 * 從台彩官方 API 匯入大樂透全部歷史開獎資料至 Supabase
 * 執行：node scripts/import-history.mjs
 *
 * 大樂透首期：2002-09（民國 91 年）
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 載入 .env.local ──
function loadEnv() {
  try {
    const raw = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const eq = line.indexOf("=");
      if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  } catch {}
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ 缺少 Supabase 環境變數");
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const API_BASE = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result";

// ── 產生月份列表（2002-09 ~ 今月）──
function monthRange(from, to) {
  const months = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function nowMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── 拉單月資料 ──
async function fetchMonth(month) {
  const url = `${API_BASE}?month=${month}&pageNum=1&pageSize=50`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json?.content?.lotto649Res ?? [];
}

// ── 轉換成 DB 格式 ──
function toRow(r) {
  const nums = r.drawNumberSize ?? [];
  if (nums.length < 7) return null;
  const [n1, n2, n3, n4, n5, n6, special] = nums;
  const draw_date = r.lotteryDate?.slice(0, 10) ?? "";
  if (!draw_date || [n1,n2,n3,n4,n5,n6].some(n => n < 1 || n > 49)) return null;
  return {
    draw_num: String(r.period),
    draw_date,
    n1, n2, n3, n4, n5, n6,
    special,
  };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 主程式 ──
async function main() {
  console.log("🎱 大樂透歷史資料匯入工具\n");

  const months = monthRange("2002-09", nowMonth());
  console.log(`📅 需掃描月份：${months[0]} → ${months[months.length - 1]}（共 ${months.length} 個月）\n`);

  const allRows = [];
  let errorCount = 0;

  for (let i = 0; i < months.length; i++) {
    const month = months[i];
    try {
      const results = await fetchMonth(month);
      const rows = results.map(toRow).filter(Boolean);
      allRows.push(...rows);
      if (rows.length > 0) {
        process.stdout.write(`  ✓ ${month}：${rows.length} 筆（累計 ${allRows.length}）\r`);
      }
    } catch (e) {
      errorCount++;
      if (errorCount <= 5) process.stdout.write(`\n  ⚠ ${month} 失敗：${e.message}\n`);
    }
    // 每 10 個月暫停一下，避免 rate limit
    if ((i + 1) % 10 === 0) await sleep(200);
  }

  console.log(`\n\n📦 取得 ${allRows.length} 筆，開始寫入 Supabase...\n`);

  // 分批 upsert
  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await sb
      .from("draw_records")
      .upsert(batch, { onConflict: "draw_num" });
    if (error) {
      console.error(`❌ 第 ${Math.floor(i / BATCH) + 1} 批失敗：`, error.message);
      process.exit(1);
    }
    done += batch.length;
    console.log(`  ✓ ${done} / ${allRows.length}`);
  }

  const { count } = await sb
    .from("draw_records")
    .select("*", { count: "exact", head: true });

  console.log(`\n🎉 完成！Supabase 資料表共 ${count} 筆`);
}

main().catch(e => { console.error(e); process.exit(1); });
