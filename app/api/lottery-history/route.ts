import { NextResponse } from "next/server";
import { supabase, type DrawRecordRow } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

const PAGE = 1000;

async function fetchAllRows(afterDate?: string): Promise<{ rows: DrawRecordRow[] | null; error: string | null }> {
  let query = supabase.from("draw_records").select("*", { count: "exact", head: true });
  if (afterDate) query = query.gt("draw_date", afterDate);
  const { count, error: countError } = await query;

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after") ?? undefined;

  const { rows, error } = await fetchAllRows(after);

  if (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
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
