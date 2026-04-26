-- ============================================================
-- Migration: cases 테이블 전체 컬럼 보장
-- 이미 있는 컬럼은 IF NOT EXISTS 로 무시됩니다.
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- defendant_name (이전 마이그레이션에서 추가했을 수 있음)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS defendant_name TEXT NOT NULL DEFAULT '';
ALTER TABLE cases ALTER COLUMN defendant_name DROP DEFAULT;

-- plaintiff_user_id
ALTER TABLE cases ADD COLUMN IF NOT EXISTS plaintiff_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- plaintiff_statement
ALTER TABLE cases ADD COLUMN IF NOT EXISTS plaintiff_statement TEXT NOT NULL DEFAULT '';
ALTER TABLE cases ALTER COLUMN plaintiff_statement DROP DEFAULT;

-- defendant_statement
ALTER TABLE cases ADD COLUMN IF NOT EXISTS defendant_statement TEXT;

-- status
ALTER TABLE cases ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cases_status_check'
  ) THEN
    ALTER TABLE cases ADD CONSTRAINT cases_status_check CHECK (status IN ('open', 'closed'));
  END IF;
END$$;

-- ai_verdict
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ai_verdict TEXT;

-- ai_verdict_winner
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ai_verdict_winner TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'cases_ai_verdict_winner_check'
  ) THEN
    ALTER TABLE cases ADD CONSTRAINT cases_ai_verdict_winner_check
      CHECK (ai_verdict_winner IN ('plaintiff', 'defendant', 'neutral'));
  END IF;
END$$;

-- updated_at
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- updated_at 자동 갱신 트리거 (없으면 생성)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'cases_updated_at'
  ) THEN
    CREATE TRIGGER cases_updated_at
      BEFORE UPDATE ON cases
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END$$;

-- ============================================================
-- 완료 확인: 아래 쿼리로 컬럼 목록을 확인하세요.
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'cases'
-- ORDER BY ordinal_position;
-- ============================================================
