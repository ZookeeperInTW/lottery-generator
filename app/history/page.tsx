"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadFromStorage, type DrawRecord } from "@/lib/lottery";

export default function HistoryPage() {
  const [records, setRecords] = useState<DrawRecord[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const state = loadFromStorage();
    if (state) setRecords(state.records);
  }, []);

  const filtered = search
    ? records.filter(
        (r) =>
          r.drawNum.includes(search) ||
          r.numbers.some((n) => String(n) === search)
      )
    : records;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[#2a2a4a] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          ← 返回
        </Link>
        <h1 className="text-lg font-bold">歷史開獎紀錄</h1>
        <span className="ml-auto text-sm text-gray-500">{records.length} 筆</span>
      </header>

      <div className="px-4 py-3 border-b border-[#2a2a4a]">
        <input
          type="text"
          placeholder="搜尋期號或號碼…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-lg bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#e63946]"
        />
      </div>

      <div className="flex-1 overflow-auto">
        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
            <span className="text-4xl">📭</span>
            <p>尚無資料，請返回主頁更新資料</p>
            <Link
              href="/"
              className="text-sm text-[#e63946] hover:underline"
            >
              前往更新
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0f0f1a] border-b border-[#2a2a4a]">
              <tr>
                <th className="text-left px-4 py-2 text-gray-400 font-normal">期號</th>
                <th className="text-left px-4 py-2 text-gray-400 font-normal">日期</th>
                <th className="text-left px-4 py-2 text-gray-400 font-normal">號碼</th>
                <th className="text-center px-4 py-2 text-gray-400 font-normal">特別號</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.drawNum}
                  className="border-b border-[#1a1a2e] hover:bg-[#1a1a2e] transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-gray-300">{r.drawNum}</td>
                  <td className="px-4 py-2.5 text-gray-400">{r.drawDate}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {r.numbers.map((n) => (
                        <span
                          key={n}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                          style={getBallStyle(n)}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 border-dashed border-gray-500 text-gray-400"
                    >
                      {r.special}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function getBallStyle(n: number): React.CSSProperties {
  if (n <= 10) return { background: "#e63946", color: "#fff" };
  if (n <= 20) return { background: "#f4a261", color: "#1a1a1a" };
  if (n <= 30) return { background: "#2a9d8f", color: "#fff" };
  if (n <= 40) return { background: "#457b9d", color: "#fff" };
  return { background: "#6d3fa8", color: "#fff" };
}
