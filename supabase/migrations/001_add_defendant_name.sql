-- Migration: cases 테이블에 defendant_name 컬럼 추가
-- Supabase Dashboard > SQL Editor 에서 실행하세요

-- 1. 컬럼 추가 (이미 있으면 무시)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS defendant_name TEXT NOT NULL DEFAULT '';

-- 2. DEFAULT 제거 (새 레코드는 명시적으로 값을 넣어야 함)
ALTER TABLE cases ALTER COLUMN defendant_name DROP DEFAULT;
