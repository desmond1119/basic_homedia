-- ============================================================================
-- DISABLE AUTO TRIGGER - 禁用自動觸發器，改用應用層控制
-- ============================================================================
-- 這個方案更安全，因為：
-- 1. 避免觸發器與應用層邏輯衝突
-- 2. 更容易調試和追蹤錯誤
-- 3. 完全控制註冊流程的每一步

-- 1. 禁用自動觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 確保 app_users 的 RLS 策略允許註冊
DROP POLICY IF EXISTS "Auth users can insert" ON public.app_users;
CREATE POLICY "Auth users can insert" ON public.app_users
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
CREATE POLICY "Users can view own profile" ON public.app_users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
CREATE POLICY "Users can update own profile" ON public.app_users
FOR UPDATE USING (auth.uid() = id);

-- 3. 允許公開查看 provider 資料
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.app_users;
CREATE POLICY "Anyone can view provider profiles" ON public.app_users
FOR SELECT USING (role = 'provider' AND is_active = true);

-- 4. Admin 可以查看所有用戶
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
CREATE POLICY "Admins can view all users" ON public.app_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.id = auth.uid() AND au.role = 'admin'
  )
);

-- 5. 確認設定
SELECT 
  'Trigger disabled' as status,
  'Registration now controlled by application layer' as note;

-- 6. 驗證 RLS 策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'app_users'
ORDER BY policyname;
