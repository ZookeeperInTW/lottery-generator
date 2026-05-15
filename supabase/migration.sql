-- 大樂透歷史開獎紀錄資料表
CREATE TABLE IF NOT EXISTS draw_records (
  draw_num  TEXT PRIMARY KEY,       -- 期號
  draw_date DATE NOT NULL,          -- 開獎日期
  n1        INTEGER NOT NULL,       -- 號碼 1（已排序）
  n2        INTEGER NOT NULL,
  n3        INTEGER NOT NULL,
  n4        INTEGER NOT NULL,
  n5        INTEGER NOT NULL,
  n6        INTEGER NOT NULL,
  special   INTEGER NOT NULL        -- 特別號
);

-- 依日期降序查詢的索引
CREATE INDEX IF NOT EXISTS idx_draw_records_date ON draw_records(draw_date DESC);

-- 開放讀取（anon key 可查）
ALTER TABLE draw_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow public read"
  ON draw_records FOR SELECT
  USING (true);

CREATE POLICY "allow anon insert"
  ON draw_records FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow anon upsert"
  ON draw_records FOR UPDATE
  USING (true);
