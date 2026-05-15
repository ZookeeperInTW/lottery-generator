"use client";

import { useState, useMemo } from "react";
import { toKey, type DrawRecord } from "@/lib/lottery";

type Props = {
  records: DrawRecord[];
};

type CheckResult =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "duplicate"; drawNum: string; drawDate: string };

export default function CheckNumbers({ records }: Props) {
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<CheckResult>({ status: "idle" });

  // 歷史 Map：key → DrawRecord（找到時能回傳期號與日期）
  const historyMap = useMemo(() => {
    const map = new Map<string, DrawRecord>();
    for (const r of records) {
      map.set(toKey(r.numbers), r);
    }
    return map;
  }, [records]);

  function toggle(n: number) {
    setResult({ status: "idle" });
    setSelected((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      if (prev.length >= 6) return prev;
      return [...prev, n];
    });
  }

  function check() {
    if (selected.length !== 6) return;
    const key = toKey(selected);
    const match = historyMap.get(key);
    if (match) {
      setResult({ status: "duplicate", drawNum: match.drawNum, drawDate: match.drawDate });
    } else {
      setResult({ status: "ok" });
    }
  }

  function clear() {
    setSelected([]);
    setResult({ status: "idle" });
  }

  const sorted = [...selected].sort((a, b) => a - b);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 已選號碼預覽 */}
      <div className="flex items-center gap-2 min-h-[3rem]">
        <span className="text-xs text-gray-500 w-12 shrink-0">已選：</span>
        <div className="flex gap-2 flex-wrap">
          {sorted.length === 0 ? (
            <span className="text-xs text-gray-600">點選下方號碼（最多 6 個）</span>
          ) : (
            sorted.map((n) => (
              <button
                key={n}
                onClick={() => toggle(n)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-transform active:scale-90"
                style={getBallStyle(n)}
              >
                {n}
              </button>
            ))
          )}
        </div>
        {selected.length > 0 && (
          <button
            onClick={clear}
            className="ml-auto text-xs text-gray-500 hover:text-white transition-colors shrink-0"
          >
            清除
          </button>
        )}
      </div>

      {/* 號碼格 1–49 */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 49 }, (_, i) => i + 1).map((n) => {
          const isSelected = selected.includes(n);
          const disabled = !isSelected && selected.length >= 6;
          return (
            <button
              key={n}
              onClick={() => toggle(n)}
              disabled={disabled}
              className={`
                aspect-square rounded-full text-sm font-bold transition-all active:scale-90
                ${isSelected
                  ? "ring-2 ring-white ring-offset-1 ring-offset-[#0f0f1a] scale-110"
                  : disabled
                    ? "opacity-25 cursor-not-allowed"
                    : "hover:scale-105"
                }
              `}
              style={isSelected ? getBallStyle(n) : getUnselectedStyle()}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* 查詢按鈕 */}
      <button
        onClick={check}
        disabled={selected.length !== 6}
        className="w-full py-3.5 rounded-2xl text-base font-bold tracking-wide transition-all
          bg-gradient-to-r from-[#457b9d] to-[#2d5f80]
          hover:from-[#5a96bc] hover:to-[#457b9d]
          active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {selected.length < 6
          ? `再選 ${6 - selected.length} 個號碼`
          : "🔍 查詢是否曾開出"}
      </button>

      {/* 結果 */}
      {result.status === "ok" && (
        <div className="rounded-2xl bg-emerald-900/30 border border-emerald-500/50 px-5 py-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">✅</span>
          <div>
            <p className="font-bold text-emerald-300">此組號碼從未開出過</p>
            <p className="text-sm text-emerald-500/80 mt-1">
              與資料庫中全部 {records.length.toLocaleString()} 筆歷史開獎比對，均不重複
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {sorted.map((n) => (
                <span
                  key={n}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={getBallStyle(n)}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {result.status === "duplicate" && (
        <div className="rounded-2xl bg-red-900/30 border border-red-500/50 px-5 py-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">❌</span>
          <div>
            <p className="font-bold text-red-300">此組號碼曾經開出過</p>
            <p className="text-sm text-red-400/80 mt-1">
              第{" "}
              <span className="font-mono font-bold text-red-300">
                {result.drawNum}
              </span>{" "}
              期｜{result.drawDate}
            </p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {sorted.map((n) => (
                <span
                  key={n}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold opacity-60"
                  style={getBallStyle(n)}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
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

function getUnselectedStyle(): React.CSSProperties {
  return { background: "#2a2a4a", color: "#9ca3af" };
}
