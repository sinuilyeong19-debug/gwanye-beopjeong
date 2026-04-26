-- ============================================================
-- FULL RESET: cases / votes 테이블 완전 재생성
-- 기존 데이터가 모두 삭제됩니다.
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1. 기존 트리거 제거
DROP TRIGGER IF EXISTS cases_updated_at ON cases;
DROP FUNCTION IF EXISTS update_updated_at();

-- 2. 기존 테이블 제거 (votes → cases 순서: FK 의존성)
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS cases;

-- 3. cases 테이블 재생성
CREATE TABLE cases (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title               TEXT        NOT NULL,
  plaintiff_name      TEXT        NOT NULL,
  defendant_name      TEXT        NOT NULL,
  plaintiff_statement TEXT        NOT NULL,
  defendant_statement TEXT,
  plaintiff_user_id   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status              TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  ai_verdict          TEXT,
  ai_verdict_winner   TEXT        CHECK (ai_verdict_winner IN ('plaintiff', 'defendant', 'neutral')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. votes 테이블 재생성
CREATE TABLE votes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id    UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       TEXT        NOT NULL CHECK (vote IN ('plaintiff', 'defendant', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (case_id, user_id)
);

-- 5. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. RLS 활성화
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes  ENABLE ROW LEVEL SECURITY;

-- 7. RLS 정책
CREATE POLICY "cases_select_all" ON cases FOR SELECT USING (true);
CREATE POLICY "cases_insert_all" ON cases FOR INSERT WITH CHECK (true);

CREATE POLICY "votes_select_all"   ON votes FOR SELECT USING (true);
CREATE POLICY "votes_insert_auth"  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes_update_own"   ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "votes_delete_own"   ON votes FOR DELETE USING (auth.uid() = user_id);

-- 8. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- ============================================================
-- 완료 확인
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'cases'
-- ORDER BY ordinal_position;
-- ============================================================
