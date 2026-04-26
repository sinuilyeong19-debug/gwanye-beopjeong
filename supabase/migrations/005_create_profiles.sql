-- ============================================================
-- Migration: profiles 테이블 생성 (온보딩 정보)
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

CREATE TABLE profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname   TEXT        NOT NULL,
  gender     TEXT        NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  age        INT         NOT NULL CHECK (age > 0 AND age < 120),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (닉네임 표시 등)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);

-- 본인만 생성
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 본인만 수정
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
