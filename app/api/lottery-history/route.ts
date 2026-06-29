import { NextResponse } from "next/server";
import { supabase, type DrawRecordRow } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

const PAGE = 1000;

export async function GET() {
  // 先查總筆數，再平行拉取所有分頁
  const { count, error: countError } = await supabase
    .from("draw_records")
    .select("*", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json(
      { success: false, error: countError.message },
      { status: 500 }
    );
  }

  const total = count ?? 0;
  if (total === 0) {
    return NextResponse.json({ success: true, count: 0, lastUpdated: new Date().toISOString(), records: [] });
  }

  const pageCount = Math.ceil(total / PAGE);
  const pages = Array.from({ length: pageCount }, (_, i) => i);

  const results = await Promise.all(
    pages.map((i) =>
      supabase
        .from("draw_records")
        .select("*")
        .order("draw_date", { ascending: false })
        .range(i * PAGE, (i + 1) * PAGE - 1)
    )
  );

  for (const { error } of results) {
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  }

  const allRows: DrawRecordRow[] = results.flatMap((r) => r.data ?? []);

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
