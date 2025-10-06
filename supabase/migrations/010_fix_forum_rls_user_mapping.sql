-- ============================================================================
-- Fix forum RLS policies to use app_users auth mapping
-- ============================================================================

-- Posts policies
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT
TO public
USING (is_deleted = false);

CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

-- Comments policies
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Comments are viewable by everyone"
ON comments FOR SELECT
TO public
USING (is_deleted = false);

CREATE POLICY "Users can insert their own comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own comments"
ON comments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comments"
ON comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

-- Likes policies
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON likes;

CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage their own likes"
ON likes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

-- Bookmarks policies
DROP POLICY IF EXISTS "Bookmarks are viewable by owner" ON bookmarks;
DROP POLICY IF EXISTS "Users can manage their own bookmarks" ON bookmarks;

CREATE POLICY "Bookmarks are viewable by owner"
ON bookmarks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own bookmarks"
ON bookmarks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

-- Reposts policies
DROP POLICY IF EXISTS "Reposts are viewable by everyone" ON reposts;
DROP POLICY IF EXISTS "Users can manage their own reposts" ON reposts;

CREATE POLICY "Reposts are viewable by everyone"
ON reposts FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can manage their own reposts"
ON reposts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM app_users au
    WHERE au.id = user_id
      AND au.auth_id = auth.uid()
  )
);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Forum RLS policies updated to use app_users.auth_id mapping';
END $$;
