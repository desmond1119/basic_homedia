-- ============================================================================
-- 修復個人檔案 RLS 策略 - 允許用戶查看自己的資料
-- ============================================================================

-- 1. 刪除所有現有的 app_users RLS 策略
DROP POLICY IF EXISTS "Auth users can insert" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;

-- 2. 創建新的 RLS 策略

-- 允許已認證用戶插入自己的記錄
CREATE POLICY "Authenticated users can insert own record" ON public.app_users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 允許已認證用戶查看自己的記錄
CREATE POLICY "Users can view own record" ON public.app_users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 允許已認證用戶更新自己的記錄
CREATE POLICY "Users can update own record" ON public.app_users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 允許任何人（包括匿名用戶）查看 provider 的公開資料
CREATE POLICY "Public can view active providers" ON public.app_users
FOR SELECT
TO public
USING (role = 'provider' AND is_active = true);

-- 允許管理員查看所有用戶
CREATE POLICY "Admins can view all" ON public.app_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.id = auth.uid() AND au.role = 'admin'
  )
);

-- 3. 確認 RLS 已啟用
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 4. 顯示當前所有策略
SELECT 
  'RLS Policies for app_users:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'app_users'
ORDER BY policyname;

-- 5. 測試查詢（這個會在 SQL Editor 中執行，用於驗證）
SELECT 
  'Test: Can fetch own user data' as test_name,
  id,
  username,
  email,
  role
FROM public.app_users
WHERE id = auth.uid()
LIMIT 1;
