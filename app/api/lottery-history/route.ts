import { NextResponse } from "next/server";
import type { DrawRecord } from "@/lib/lottery";

// 台彩大樂透官方 API
// 每次最多回傳 100 筆，需分頁拉取
const TW_LOTTERY_API =
  "https://www.taiwanlottery.com/lotto/dlt/history.aspx";

type TaiwanLotteryRow = {
  期號: string;
  開獎日期: string;
  號碼1: string;
  號碼2: string;
  號碼3: string;
  號碼4: string;
  號碼5: string;
  號碼6: string;
  特別號: string;
};

// 台彩提供的 JSON API endpoint（非官方文件但可用）
async function fetchFromAPI(page: number): Promise<DrawRecord[]> {
  const url = `https://www.taiwanlottery.com/lotto/dlt/history.aspx?indexPage=${page}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();

  // 解析 HTML 表格中的開獎資料
  const records: DrawRecord[] = [];

  // 找到表格資料列
  const rowRegex =
    /<tr[^>]*>\s*(?:<td[^>]*>([^<]*)<\/td>\s*){9,}/gi;
  const tdRegex = /<td[^>]*>\s*([^<]*)\s*<\/td>/gi;
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const row of rows) {
    const cells: string[] = [];
    let m;
    const tdR = /<td[^>]*>\s*([^<]*)\s*<\/td>/gi;
    while ((m = tdR.exec(row)) !== null) {
      cells.push(m[1].trim());
    }

    // 大樂透每列格式：期號, 日期, n1, n2, n3, n4, n5, n6, 特別號
    if (cells.length >= 9) {
      const drawNum = cells[0];
      const drawDate = cells[1];
      const nums = cells.slice(2, 8).map(Number);
      const special = Number(cells[8]);

      if (
        drawNum &&
        drawDate &&
        nums.length === 6 &&
        nums.every((n) => n >= 1 && n <= 49) &&
        special >= 1 &&
        special <= 49
      ) {
        records.push({
          drawNum,
          drawDate: formatDate(drawDate),
          numbers: nums.sort((a, b) => a - b),
          special,
        });
      }
    }
  }

  return records;
}

function formatDate(raw: string): string {
  // 台彩日期格式可能是 "113/06/07" (民國) 或 "2024/06/07"
  const parts = raw.split("/");
  if (parts.length === 3) {
    const y = parseInt(parts[0]);
    const m = parts[1].padStart(2, "0");
    const d = parts[2].padStart(2, "0");
    // 民國年轉西元
    const year = y < 1000 ? y + 1911 : y;
    return `${year}-${m}-${d}`;
  }
  return raw;
}

export async function GET() {
  try {
    // 抓取最近 5 頁（約 500 筆）
    const pagePromises = [1, 2, 3, 4, 5].map(fetchFromAPI);
    const pages = await Promise.allSettled(pagePromises);

    const allRecords: DrawRecord[] = [];
    for (const result of pages) {
      if (result.status === "fulfilled") {
        allRecords.push(...result.value);
      }
    }

    // 去重（按期號）
    const seen = new Set<string>();
    const unique = allRecords.filter((r) => {
      if (seen.has(r.drawNum)) return false;
      seen.add(r.drawNum);
      return true;
    });

    // 按日期降序排列
    unique.sort((a, b) => b.drawDate.localeCompare(a.drawDate));

    return NextResponse.json({
      success: true,
      count: unique.length,
      lastUpdated: new Date().toISOString(),
      records: unique,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
