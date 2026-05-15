import { NextResponse } from "next/server";
import { supabase, type DrawRecordRow } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

export async function GET() {
  // Supabase 預設上限 1000 筆，需分頁拉取全部
  const PAGE = 1000;
  const allRows: DrawRecordRow[] = [];
  let from = 0;
  let total = Infinity;

  while (allRows.length < total) {
    const { data, error, count } = await supabase
      .from("draw_records")
      .select("*", { count: "exact" })
      .order("draw_date", { ascending: false })
      .range(from, from + PAGE - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (count !== null) total = count;
    if (!data || data.length === 0) break;

    allRows.push(...data);
    from += PAGE;
  }

  const records: DrawRecord[] = allRows.map((r) => ({
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
