"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  buildHistorySet,
  generateUniqueNumbers,
  loadFromStorage,
  saveToStorage,
  loadGenerated,
  saveGenerated,
  type LotteryState,
  type GeneratedEntry,
} from "@/lib/lottery";

export default function LotteryApp() {
  const [historyState, setHistoryState] = useState<LotteryState | null>(null);
  const [generated, setGenerated] = useState<GeneratedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  // 初始化：從 localStorage 讀取
  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) setHistoryState(saved);
    setGenerated(loadGenerated());
  }, []);

  // 從台彩抓取最新資料
  const fetchLatest = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/lottery-history");
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "未知錯誤");
      if (data.records.length === 0) throw new Error("未取得任何資料，請稍後再試");
      const newState: LotteryState = {
        records: data.records,
        lastUpdated: data.lastUpdated,
      };
      setHistoryState(newState);
      saveToStorage(newState);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }, []);

  // 產生號碼
  const generate = useCallback(() => {
    if (!historyState) {
      setError("請先點擊「更新資料」載入歷史開獎紀錄");
      return;
    }
    setLoading(true);
    setAnimating(false);

    // 用 setTimeout 讓動畫重設
    setTimeout(() => {
      const historySet = buildHistorySet(historyState.records);
      const nums = generateUniqueNumbers(historySet);
      if (!nums) {
        setError("產生失敗，請重試");
        setLoading(false);
        return;
      }
      const entry: GeneratedEntry = {
        id: Date.now().toString(),
        numbers: nums,
        generatedAt: new Date().toISOString(),
      };
      const updated = [entry, ...generated].slice(0, 20); // 最多保留 20 筆
      setGenerated(updated);
      saveGenerated(updated);
      setAnimating(true);
      setLoading(false);
    }, 50);
  }, [historyState, generated]);

  const latest = generated[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2a4a] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎱</span>
          <h1 className="text-lg font-bold tracking-tight">大樂透產生器</h1>
        </div>
        <Link
          href="/history"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          開獎紀錄 →
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 gap-6 max-w-lg mx-auto w-full">
        {/* 狀態列 */}
        <div className="w-full rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">歷史開獎筆數</p>
            <p className="text-xl font-bold text-white">
              {historyState ? historyState.records.length.toLocaleString() : "—"}
            </p>
            {historyState && (
              <p className="text-xs text-gray-500 mt-0.5">
                更新：{new Date(historyState.lastUpdated).toLocaleDateString("zh-TW")}
              </p>
            )}
          </div>
          <button
            onClick={fetchLatest}
            disabled={fetching}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] transition-colors disabled:opacity-50"
          >
            {fetching ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full spin-slow" />
            ) : (
              <span>↻</span>
            )}
            {fetching ? "更新中…" : "更新資料"}
          </button>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="w-full rounded-xl bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-300">
            ⚠ {error}
          </div>
        )}

        {/* 號碼球顯示區 */}
        <div className="w-full rounded-2xl bg-[#1a1a2e] border border-[#2a2a4a] p-6 flex flex-col items-center gap-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest">本次號碼</p>

          <div className="flex gap-3 flex-wrap justify-center">
            {latest ? (
              latest.numbers.map((n, i) => (
                <LotteryBall
                  key={`${latest.id}-${n}`}
                  number={n}
                  delay={i * 80}
                  animate={animating}
                />
              ))
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-full bg-[#2a2a4a] border-2 border-[#3a3a5a]"
                />
              ))
            )}
          </div>

          {latest && (
            <p className="text-xs text-gray-500">
              {new Date(latest.generatedAt).toLocaleString("zh-TW")}
            </p>
          )}
        </div>

        {/* 產生按鈕 */}
        <button
          onClick={generate}
          disabled={loading || fetching}
          className="w-full py-4 rounded-2xl text-lg font-bold tracking-wide transition-all
            bg-gradient-to-r from-[#e63946] to-[#c1121f]
            hover:from-[#ff4d5a] hover:to-[#e63946]
            active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg shadow-red-900/30"
        >
          {loading ? "產生中…" : "🎲 隨機選號"}
        </button>

        {/* 警語 */}
        <p className="text-xs text-gray-600 text-center">
          此工具確保產生的號碼組合與所有歷史開獎紀錄不重複
          <br />
          投注前請確認個人財務狀況，理性購彩
        </p>

        {/* 近期產生紀錄 */}
        {generated.length > 1 && (
          <div className="w-full">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">
              近期產生紀錄
            </p>
            <div className="flex flex-col gap-2">
              {generated.slice(1, 6).map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl bg-[#1a1a2e] border border-[#2a2a4a] px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex gap-2">
                    {entry.numbers.map((n) => (
                      <span
                        key={n}
                        className="text-sm font-mono font-bold text-gray-300 w-6 text-center"
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(entry.generatedAt).toLocaleDateString("zh-TW")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LotteryBall({
  number,
  delay,
  animate,
}: {
  number: number;
  delay: number;
  animate: boolean;
}) {
  const color = getBallColor(number);
  return (
    <div
      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg
        ${animate ? "ball-animate" : ""}`}
      style={{
        background: color.bg,
        color: color.text,
        animationDelay: animate ? `${delay}ms` : "0ms",
        border: `3px solid ${color.border}`,
      }}
    >
      {String(number).padStart(2, "0")}
    </div>
  );
}

function getBallColor(n: number): { bg: string; text: string; border: string } {
  if (n <= 10) return { bg: "#e63946", text: "#fff", border: "#ff6b74" };
  if (n <= 20) return { bg: "#f4a261", text: "#1a1a1a", border: "#f7b87a" };
  if (n <= 30) return { bg: "#2a9d8f", text: "#fff", border: "#3abfaf" };
  if (n <= 40) return { bg: "#457b9d", text: "#fff", border: "#6096b4" };
  return { bg: "#6d3fa8", text: "#fff", border: "#9b5de5" };
}
