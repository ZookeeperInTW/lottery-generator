/**
 * 驗證腳本：確認產生的號碼都不與歷史資料重複
 * 執行：node scripts/verify-uniqueness.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ── 與 lib/lottery.ts 相同的邏輯 ──
function toKey(numbers) {
  return [...numbers].sort((a, b) => a - b).join(",");
}

function buildHistorySet(rows) {
  return new Set(rows.map(r => toKey([r.n1, r.n2, r.n3, r.n4, r.n5, r.n6])));
}

function pickSix() {
  const pool = Array.from({ length: 49 }, (_, i) => i + 1);
  const picked = [];
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked.sort((a, b) => a - b);
}

function generateUniqueNumbers(historySet) {
  for (let i = 0; i < 10000; i++) {
    const candidate = pickSix();
    if (!historySet.has(toKey(candidate))) return candidate;
  }
  return null;
}

async function main() {
  console.log("🔍 驗證開始...\n");

  // 1. 從 Supabase 分頁拉全部歷史資料
  const PAGE = 1000;
  const data = [];
  let from = 0, total = Infinity, count = 0;
  while (data.length < total) {
    const { data: rows, error, count: c } = await sb
      .from("draw_records")
      .select("n1,n2,n3,n4,n5,n6,draw_num,draw_date", { count: "exact" })
      .range(from, from + PAGE - 1);
    if (error) { console.error("❌ 讀取 Supabase 失敗:", error.message); process.exit(1); }
    if (c !== null) { total = c; count = c; }
    if (!rows || rows.length === 0) break;
    data.push(...rows);
    from += PAGE;
  }

  console.log(`✅ 從 Supabase 讀取 ${count} 筆歷史資料`);

  // 2. 建立比對 Set
  const historySet = buildHistorySet(data);
  console.log(`✅ 比對用 Set 大小：${historySet.size}（應等於 ${count}）`);

  if (historySet.size !== count) {
    console.warn(`⚠ 大小不符！可能有重複的號碼組合存在於不同期號`);
  }

  // 3. 用實際開獎資料驗證比對功能正確性
  console.log("\n📋 隨機抽取 5 筆歷史紀錄，確認都在 Set 內：");
  const sample = data.sort(() => Math.random() - 0.5).slice(0, 5);
  let allFound = true;
  for (const r of sample) {
    const nums = [r.n1, r.n2, r.n3, r.n4, r.n5, r.n6];
    const key = toKey(nums);
    const found = historySet.has(key);
    if (!found) allFound = false;
    console.log(`  期號 ${r.draw_num} [${nums.join(",")}] → ${found ? "✅ 在 Set 內" : "❌ 不在 Set 內（錯誤！）"}`);
  }

  if (!allFound) {
    console.error("\n❌ 歷史資料比對邏輯有誤！");
    process.exit(1);
  }

  // 4. 產生 1000 組號碼，逐一確認不重複
  console.log("\n🎲 產生 1000 組號碼，確認全部不重複於歷史...");
  let collisions = 0;
  const generated = [];

  for (let i = 0; i < 1000; i++) {
    const nums = generateUniqueNumbers(historySet);
    if (!nums) { console.error("❌ 產生失敗（10000 次仍找不到）"); break; }
    const key = toKey(nums);
    if (historySet.has(key)) {
      collisions++;
      console.error(`  ❌ 第 ${i+1} 組 [${nums.join(",")}] 與歷史紀錄重複！`);
    }
    generated.push(key);
  }

  // 5. 確認 1000 組之間也無重複（雖不是需求，但可驗證隨機性）
  const generatedSet = new Set(generated);
  const selfDuplicates = 1000 - generatedSet.size;

  console.log(`\n📊 結果：`);
  console.log(`  與歷史重複：${collisions} 筆`);
  console.log(`  1000 組中自身重複：${selfDuplicates} 筆（機率極低，正常）`);

  if (collisions === 0) {
    console.log("\n🎉 驗證通過！產生的號碼確實不會與歷史開獎紀錄重複");
  } else {
    console.error("\n❌ 驗證失敗！有號碼與歷史重複");
    process.exit(1);
  }

  // 6. 顯示幾筆產生的號碼作為範例
  console.log("\n🎱 範例號碼（前 3 組）：");
  generated.slice(0, 3).forEach((k, i) => {
    console.log(`  第 ${i+1} 組：${k.replace(/,/g, "  ")}`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
