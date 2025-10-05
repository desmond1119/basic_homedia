-- ⚡ 最簡單的登入修復腳本
-- 直接在 Supabase SQL Editor 執行

-- Step 1: 臨時禁用 RLS
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- Step 2: 為所有 auth.users 創建 app_users 記錄
DO $$
DECLARE
  auth_record RECORD;
  new_username TEXT;
  user_role_val user_role;
BEGIN
  FOR auth_record IN 
    SELECT id, email, raw_user_meta_data, created_at, email_confirmed_at
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = auth.users.id)
  LOOP
    -- 生成 username
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
    
    -- 設定角色（使用變數避免類型問題）
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
    
    RAISE NOTICE 'Created app_user for: % (username: %)', auth_record.email, new_username;
  END LOOP;
END $$;

-- Step 3: 重新啟用 RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Step 4: 檢查結果
SELECT 
  'Total auth.users' as metric,
  count(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'Total app_users',
  count(*)::text
FROM app_users
UNION ALL
SELECT 
  'Missing app_users (should be 0)',
  count(*)::text
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id);

-- Step 5: 顯示所有用戶狀態
SELECT 
  au.email,
  apu.username,
  apu.role::text as role,
  apu.is_active,
  CASE 
    WHEN apu.id IS NOT NULL THEN '✅ OK'
    ELSE '❌ MISSING'
  END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;
