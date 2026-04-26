-- ============================================================
-- 관계법정 Supabase Schema
-- Supabase Dashboard > SQL Editor 에서 실행하세요
--
-- [기존 테이블에 적용할 경우]
-- supabase/migrations/001_add_defendant_name.sql 을 먼저 실행하세요.
-- ============================================================

-- 1. Cases (사건)
CREATE TABLE IF NOT EXISTS cases (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title              TEXT        NOT NULL,
  plaintiff_name     TEXT        NOT NULL,
  defendant_name     TEXT        NOT NULL,
  plaintiff_statement TEXT       NOT NULL,
  defendant_statement TEXT,
  plaintiff_user_id  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  status             TEXT        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  ai_verdict         TEXT,
  ai_verdict_winner  TEXT        CHECK (ai_verdict_winner IN ('plaintiff', 'defendant', 'neutral')),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Votes (배심원 투표)
CREATE TABLE IF NOT EXISTS votes (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id    UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote       TEXT        NOT NULL CHECK (vote IN ('plaintiff', 'defendant', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (case_id, user_id)
);

-- 3. Auto-update updated_at
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

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes  ENABLE ROW LEVEL SECURITY;

-- Cases: 누구나 읽기 가능
CREATE POLICY "cases_select_all" ON cases FOR SELECT USING (true);

-- Cases: 누구나 접수 가능 (비로그인 포함)
CREATE POLICY "cases_insert_all" ON cases FOR INSERT WITH CHECK (true);

-- Cases: AI 판결 업데이트는 service_role 만 (API route에서 service key 사용)
-- anon/authenticated는 UPDATE 불가 (service role key bypasses RLS)

-- Votes: 누구나 읽기
CREATE POLICY "votes_select_all" ON votes FOR SELECT USING (true);

-- Votes: 로그인한 사용자만 투표
CREATE POLICY "votes_insert_auth" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Votes: 본인 투표만 수정
CREATE POLICY "votes_update_own" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Votes: 본인 투표만 삭제
CREATE POLICY "votes_delete_own" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Realtime (배심원 실시간 업데이트)
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- ============================================================
-- 완료! Google OAuth는 Supabase Dashboard > Authentication >
-- Providers > Google 에서 설정하세요.
-- ============================================================
