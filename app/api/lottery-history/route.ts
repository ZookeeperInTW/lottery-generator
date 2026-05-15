import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { DrawRecord } from "@/lib/lottery";

export async function GET() {
  const { data, error, count } = await supabase
    .from("draw_records")
    .select("*", { count: "exact" })
    .order("draw_date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  const records: DrawRecord[] = (data ?? []).map((r) => ({
    drawNum: r.draw_num,
    drawDate: r.draw_date,
    numbers: [r.n1, r.n2, r.n3, r.n4, r.n5, r.n6].sort((a, b) => a - b),
    special: r.special,
  }));

  return NextResponse.json({
    success: true,
    count: count ?? records.length,
    lastUpdated: new Date().toISOString(),
    records,
  });
}
