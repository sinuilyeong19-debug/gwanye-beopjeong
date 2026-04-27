-- ============================================================
-- Migration: 커뮤니티 게시판 (posts, post_likes, comments)
-- Supabase Dashboard > SQL Editor 에서 실행하세요.
-- ============================================================

-- 1. posts 테이블
CREATE TABLE posts (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  content       TEXT        NOT NULL,
  category      TEXT        NOT NULL CHECK (category IN ('자유', '사연공유', '판결결과', '질문')),
  likes         INT         NOT NULL DEFAULT 0,
  comment_count INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. post_likes 테이블 (중복 좋아요 방지)
CREATE TABLE post_likes (
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 3. comments 테이블
CREATE TABLE comments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. comment_count 자동 동기화 트리거
CREATE OR REPLACE FUNCTION sync_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(0, comment_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION sync_comment_count();

-- 5. RLS
ALTER TABLE posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select_all"  ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_auth" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete_own"  ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "post_likes_select_all"  ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_auth" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete_own"  ON post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_select_all"  ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"  ON comments FOR DELETE USING (auth.uid() = user_id);

-- 6. toggle_post_like RPC (원자적 처리)
CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM post_likes WHERE post_id = p_post_id AND user_id = p_user_id;
    UPDATE posts SET likes = GREATEST(0, likes - 1) WHERE id = p_post_id;
    RETURN false;
  ELSE
    INSERT INTO post_likes (post_id, user_id) VALUES (p_post_id, p_user_id);
    UPDATE posts SET likes = likes + 1 WHERE id = p_post_id;
    RETURN true;
  END IF;
END;
$$;
