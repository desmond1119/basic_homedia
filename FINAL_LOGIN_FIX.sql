-- 🚀 最終登入修復腳本
-- 直接在 Supabase Dashboard SQL Editor 執行

-- ==========================================
-- 第一部分：修復 RLS 政策
-- ==========================================

-- 1. 刪除有問題的政策
DROP POLICY IF EXISTS "Users can view their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON app_users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON app_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON app_users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON app_users;
DROP POLICY IF EXISTS "allow_select_own" ON app_users;
DROP POLICY IF EXISTS "allow_insert_own" ON app_users;
DROP POLICY IF EXISTS "allow_update_own" ON app_users;
DROP POLICY IF EXISTS "allow_admin_select_all" ON app_users;

-- 2. 創建安全函數（避免遞迴）
CREATE OR REPLACE FUNCTION public.is_user_allowed(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() = user_id;
$$;

-- 授權執行權限
GRANT EXECUTE ON FUNCTION public.is_user_allowed(uuid) TO authenticated;

-- 3. 創建新的 RLS 政策
CREATE POLICY "allow_select_own"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (public.is_user_allowed(id));

CREATE POLICY "allow_insert_own"
  ON app_users
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_user_allowed(id));

CREATE POLICY "allow_update_own"
  ON app_users
  FOR UPDATE
  TO authenticated
  USING (public.is_user_allowed(id))
  WITH CHECK (public.is_user_allowed(id));

-- ==========================================
-- 第二部分：修復現有用戶
-- ==========================================

-- 4. 臨時禁用 RLS
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 5. 為現有 auth.users 創建 app_users 記錄
DO $$
DECLARE
  auth_record RECORD;
  new_username TEXT;
  user_role_val user_role;
  counter INTEGER := 0;
BEGIN
  RAISE NOTICE '開始修復現有用戶...';
  
  FOR auth_record IN 
    SELECT id, email, raw_user_meta_data, created_at, email_confirmed_at
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = auth.users.id)
  LOOP
    counter := counter + 1;
    
    -- 生成用戶名
    new_username := COALESCE(
      auth_record.raw_user_meta_data->>'username',
      split_part(auth_record.email, '@', 1)
    );
    
    IF new_username IS NULL OR new_username = '' THEN
      new_username := 'user_' || substring(auth_record.id::text, 1, 8);
    END IF;
    
    -- 確保唯一性
    WHILE EXISTS (SELECT 1 FROM app_users WHERE username = new_username) LOOP
      new_username := new_username || '_' || substring(md5(random()::text), 1, 4);
    END LOOP;
    
    -- 設定角色
    user_role_val := CASE 
      WHEN auth_record.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN auth_record.raw_user_meta_data->>'role' = 'provider' THEN 'provider'::user_role
      ELSE 'homeowner'::user_role
    END;
    
    -- 插入記錄
    INSERT INTO app_users (
      id,
      username,
      email,
      role,
      full_name,
      phone,
      avatar_url,
      is_active,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      auth_record.id,
      new_username,
      auth_record.email,
      user_role_val,
      COALESCE(
        auth_record.raw_user_meta_data->>'fullName',
        auth_record.raw_user_meta_data->>'full_name',
        split_part(auth_record.email, '@', 1)
      ),
      auth_record.raw_user_meta_data->>'phone',
      COALESCE(
        auth_record.raw_user_meta_data->>'avatarUrl',
        auth_record.raw_user_meta_data->>'avatar_url'
      ),
      true,
      COALESCE(auth_record.email_confirmed_at IS NOT NULL, false),
      COALESCE(auth_record.created_at, NOW()),
      NOW()
    );
    
    RAISE NOTICE '✅ 已創建用戶: % (username: %)', auth_record.email, new_username;
  END LOOP;
  
  RAISE NOTICE '完成！共修復 % 個用戶', counter;
END $$;

-- 6. 重新啟用 RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 第三部分：修復觸發器
-- ==========================================

-- 7. 創建新的觸發器函數
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  generated_username TEXT;
  user_role_val user_role;
  attempt INTEGER := 0;
BEGIN
  -- 生成用戶名
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  IF generated_username IS NULL OR generated_username = '' THEN
    generated_username := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;
  
  -- 確保唯一性
  WHILE EXISTS (SELECT 1 FROM app_users WHERE username = generated_username) AND attempt < 10 LOOP
    generated_username := generated_username || '_' || substring(md5(random()::text || attempt::text), 1, 4);
    attempt := attempt + 1;
  END LOOP;
  
  -- 設定角色
  user_role_val := CASE 
    WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
    WHEN NEW.raw_user_meta_data->>'role' = 'provider' THEN 'provider'::user_role
    ELSE 'homeowner'::user_role
  END;
  
  -- 插入或更新
  INSERT INTO public.app_users (
    id,
    username,
    email,
    full_name,
    phone,
    avatar_url,
    role,
    provider_type_id,
    is_active,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    generated_username,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'avatarUrl', NEW.raw_user_meta_data->>'avatar_url'),
    user_role_val,
    (NEW.raw_user_meta_data->>'providerTypeId')::uuid,
    true,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      app_users.username
    ),
    full_name = COALESCE(
      NULLIF(EXCLUDED.full_name, ''),
      app_users.full_name
    ),
    phone = COALESCE(
      NEW.raw_user_meta_data->>'phone',
      app_users.phone
    ),
    avatar_url = COALESCE(
      NULLIF(EXCLUDED.avatar_url, ''),
      app_users.avatar_url
    ),
    role = user_role_val,
    provider_type_id = COALESCE(
      (NEW.raw_user_meta_data->>'providerTypeId')::uuid,
      app_users.provider_type_id
    ),
    email_verified = COALESCE(NEW.email_confirmed_at IS NOT NULL, app_users.email_verified),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '觸發器錯誤 %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;

-- 8. 重新創建觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 第四部分：驗證修復
-- ==========================================

-- 9. 檢查結果
SELECT 
  '🔍 修復結果檢查' as check_type,
  '' as details
UNION ALL
SELECT 
  '📊 Auth Users 總數',
  count(*)::text
FROM auth.users
UNION ALL
SELECT 
  '📊 App Users 總數',
  count(*)::text
FROM app_users
UNION ALL
SELECT 
  '⚠️ 缺失的 App Users (應該是 0)',
  count(*)::text
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
UNION ALL
SELECT 
  '🔐 RLS 政策數量',
  count(*)::text
FROM pg_policies 
WHERE tablename = 'app_users'
UNION ALL
SELECT 
  '⚡ 觸發器狀態',
  CASE WHEN count(*) > 0 THEN '✅ 已創建' ELSE '❌ 缺失' END
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 10. 顯示所有用戶狀態
SELECT 
  '👥 用戶狀態列表' as section,
  '' as email,
  '' as username,
  '' as role,
  '' as status
UNION ALL
SELECT 
  '---',
  au.email,
  COALESCE(apu.username, '❌ 缺失'),
  COALESCE(apu.role::text, '❌ 缺失'),
  CASE 
    WHEN apu.id IS NOT NULL THEN '✅ OK'
    ELSE '❌ 缺失 APP_USER'
  END
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;

-- 完成提示
SELECT '🎉 修復完成！請重新載入應用並嘗試登入。' as message;
