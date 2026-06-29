import { NextResponse } from "next/server";
import { supabase, type DrawRecordRow } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

const PAGE = 1000;
const TLC_API = "https://api.taiwanlottery.com/TLCAPIWeB/Lottery/Lotto649Result";

// ── 台彩 API ──────────────────────────────────────────────

async function fetchMonthFromTLC(month: string): Promise<DrawRecordRow[]> {
  const url = `${TLC_API}?month=${month}&pageNum=1&pageSize=50`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`台彩 API HTTP ${res.status}`);
  const json = await res.json();
  const items: unknown[] = json?.content?.lotto649Res ?? [];

  return items.flatMap((r: unknown) => {
    const row = r as Record<string, unknown>;
    const nums = row.drawNumberSize as number[] | undefined;
    if (!nums || nums.length < 7) return [];
    const [n1, n2, n3, n4, n5, n6, special] = nums;
    const draw_date = (row.lotteryDate as string | undefined)?.slice(0, 10) ?? "";
    if (!draw_date || [n1, n2, n3, n4, n5, n6].some((n) => n < 1 || n > 49)) return [];
    return [{ draw_num: String(row.period), draw_date, n1, n2, n3, n4, n5, n6, special }];
  });
}

function monthRange(from: string, to: string): string[] {
  const months: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

function nowMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── 增量同步：從台彩拉新資料並 upsert 進 Supabase ──────────

async function syncLatest(): Promise<{ error: string | null }> {
  // 找 Supabase 最新期日期
  const { data: latest, error: latestError } = await supabase
    .from("draw_records")
    .select("draw_date")
    .order("draw_date", { ascending: false })
    .limit(1)
    .single();

  if (latestError && latestError.code !== "PGRST116") {
    return { error: latestError.message };
  }

  // 從最新期所在月份開始拉（可能有同月更新），無資料則從 2002-09 開始
  const fromMonth = latest?.draw_date
    ? latest.draw_date.slice(0, 7)
    : "2002-09";

  const months = monthRange(fromMonth, nowMonth());
  const newRows: DrawRecordRow[] = [];

  for (const month of months) {
    try {
      const rows = await fetchMonthFromTLC(month);
      newRows.push(...rows);
    } catch {
      // 單月失敗不中斷，繼續下一月
    }
  }

  if (newRows.length === 0) return { error: null };

  // 分批 upsert
  const BATCH = 200;
  for (let i = 0; i < newRows.length; i += BATCH) {
    const { error } = await supabase
      .from("draw_records")
      .upsert(newRows.slice(i, i + BATCH), { onConflict: "draw_num" });
    if (error) return { error: error.message };
  }

  return { error: null };
}

// ── 從 Supabase 讀取資料（支援增量參數）──────────────────────

async function fetchAllRows(afterDate?: string): Promise<{ rows: DrawRecordRow[] | null; error: string | null }> {
  let countQuery = supabase.from("draw_records").select("*", { count: "exact", head: true });
  if (afterDate) countQuery = countQuery.gt("draw_date", afterDate);
  const { count, error: countError } = await countQuery;

  if (countError) return { rows: null, error: countError.message };

  const total = count ?? 0;
  if (total === 0) return { rows: [], error: null };

  const pageCount = Math.ceil(total / PAGE);
  const results = await Promise.all(
    Array.from({ length: pageCount }, (_, i) => {
      let q = supabase
        .from("draw_records")
        .select("*")
        .order("draw_date", { ascending: false })
        .range(i * PAGE, (i + 1) * PAGE - 1);
      if (afterDate) q = q.gt("draw_date", afterDate);
      return q;
    })
  );

  for (const { error } of results) {
    if (error) return { rows: null, error: error.message };
  }

  return { rows: results.flatMap((r) => r.data ?? []), error: null };
}

// ── Route Handler ─────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") ?? undefined;

  // 先同步台彩最新資料（失敗不中斷，繼續用既有 Supabase 資料）
  const { error: syncError } = await syncLatest();

  // 再回傳增量或全量
  const { rows, error: fetchError } = await fetchAllRows(after);
  if (fetchError) {
    return NextResponse.json(
      { success: false, error: `fetch: ${fetchError}${syncError ? ` / sync: ${syncError}` : ""}` },
      { status: 500 }
    );
  }

  const records: DrawRecord[] = (rows ?? []).map((r) => ({
    drawNum: r.draw_num,
    drawDate: r.draw_date,
    numbers: [r.n1, r.n2, r.n3, r.n4, r.n5, r.n6].sort((a, b) => a - b),
    special: r.special,
  }));

  return NextResponse.json({
    success: true,
    count: records.length,
    lastUpdated: new Date().toISOString(),
    records,
  });
}
