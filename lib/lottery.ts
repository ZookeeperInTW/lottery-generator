export type DrawRecord = {
  drawDate: string;  // "YYYY-MM-DD"
  drawNum: string;   // 期號
  numbers: number[]; // 6 個號碼，已排序
  special: number;   // 特別號
};

export type LotteryState = {
  records: DrawRecord[];
  lastUpdated: string;
};

// 將 6 個號碼組合成可比對的 key
export function toKey(numbers: number[]): string {
  return [...numbers].sort((a, b) => a - b).join(",");
}

// 建立歷史紀錄的 Set（快速查詢）
export function buildHistorySet(records: DrawRecord[]): Set<string> {
  return new Set(records.map((r) => toKey(r.numbers)));
}

// 從 1-49 隨機抽 6 個不重複號碼
function pickSix(): number[] {
  const pool = Array.from({ length: 49 }, (_, i) => i + 1);
  const picked: number[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked.sort((a, b) => a - b);
}

// 產生一組不存在於歷史紀錄的號碼（最多嘗試 10000 次）
export function generateUniqueNumbers(historySet: Set<string>): number[] | null {
  for (let i = 0; i < 10000; i++) {
    const candidate = pickSix();
    if (!historySet.has(toKey(candidate))) {
      return candidate;
    }
  }
  return null; // 極低機率發生
}

// 本地儲存 key
export const STORAGE_KEY = "lottery_history";
export const GENERATED_KEY = "lottery_generated";

export function saveToStorage(state: LotteryState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadFromStorage(): LotteryState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LotteryState;
  } catch {
    return null;
  }
}

export type GeneratedEntry = {
  id: string;
  numbers: number[];
  generatedAt: string;
};

export function saveGenerated(entries: GeneratedEntry[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GENERATED_KEY, JSON.stringify(entries));
}

export function loadGenerated(): GeneratedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GENERATED_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as GeneratedEntry[];
  } catch {
    return [];
  }
}
