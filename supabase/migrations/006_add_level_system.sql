-- ============================================================
-- Migration: profiles 테이블에 레벨 시스템 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS exp         INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level       INT NOT NULL DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_votes INT NOT NULL DEFAULT 0;

-- ============================================================
-- RPC: 투표 시 경험치 +10, total_votes +1, 레벨 자동 계산
-- ============================================================
CREATE OR REPLACE FUNCTION add_vote_exp(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exp   INT;
  v_level INT;
BEGIN
  UPDATE profiles
  SET exp = exp + 10, total_votes = total_votes + 1
  WHERE id = p_user_id
  RETURNING exp INTO v_exp;

  v_level := CASE
    WHEN v_exp >= 2000 THEN 6
    WHEN v_exp >= 1000 THEN 5
    WHEN v_exp >= 600  THEN 4
    WHEN v_exp >= 300  THEN 3
    WHEN v_exp >= 100  THEN 2
    ELSE 1
  END;

  UPDATE profiles SET level = v_level WHERE id = p_user_id;
END;
$$;
