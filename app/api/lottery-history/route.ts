import { NextResponse } from "next/server";
import { supabase, type DrawRecordRow } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

export async function GET() {
  // 先查總筆數，再用單一請求拉取全部資料
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
  const { data, error } = await supabase
    .from("draw_records")
    .select("*")
    .order("draw_date", { ascending: false })
    .range(0, total - 1);

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const allRows: DrawRecordRow[] = data ?? [];

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
