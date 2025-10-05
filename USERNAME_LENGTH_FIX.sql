-- 🔧 修復 username 長度約束問題
-- 直接在 Supabase Dashboard SQL Editor 執行

-- 1. 檢查 username 約束
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname LIKE '%username%' 
AND conrelid = 'app_users'::regclass;

-- 2. 檢查有問題的用戶
SELECT 
  au.email,
  au.raw_user_meta_data->>'username' as metadata_username,
  split_part(au.email, '@', 1) as email_prefix,
  length(split_part(au.email, '@', 1)) as prefix_length
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
ORDER BY length(split_part(au.email, '@', 1));

-- 3. 臨時禁用 RLS
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 4. 修復現有用戶（確保 username 長度 >= 3）
DO $$
DECLARE
  auth_record RECORD;
  new_username TEXT;
  user_role_val user_role;
  counter INTEGER := 0;
  email_prefix TEXT;
BEGIN
  RAISE NOTICE '開始修復用戶名長度問題...';
  
  FOR auth_record IN 
    SELECT id, email, raw_user_meta_data, created_at, email_confirmed_at
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = auth.users.id)
  LOOP
    counter := counter + 1;
    
    -- 獲取 email 前綴
    email_prefix := split_part(auth_record.email, '@', 1);
    
    -- 生成符合長度要求的用戶名
    new_username := COALESCE(
      auth_record.raw_user_meta_data->>'username',
      CASE 
        WHEN length(email_prefix) >= 3 THEN email_prefix
        ELSE 'user_' || email_prefix || '_' || substring(auth_record.id::text, 1, 4)
      END
    );
    
    -- 確保最小長度為 3
    IF length(new_username) < 3 THEN
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
        NULLIF(auth_record.raw_user_meta_data->>'fullName', ''),
        NULLIF(auth_record.raw_user_meta_data->>'full_name', ''),
        CASE 
          WHEN length(email_prefix) >= 2 THEN email_prefix
          ELSE 'User'
        END
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
    
    RAISE NOTICE '✅ 已創建用戶: % (username: %, length: %)', 
      auth_record.email, new_username, length(new_username);
  END LOOP;
  
  RAISE NOTICE '完成！共修復 % 個用戶', counter;
END $$;

-- 5. 重新啟用 RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 6. 更新觸發器函數（確保未來的用戶名也符合長度要求）
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
  email_prefix TEXT;
BEGIN
  -- 獲取 email 前綴
  email_prefix := split_part(NEW.email, '@', 1);
  
  -- 生成符合長度要求的用戶名
  generated_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    CASE 
      WHEN length(email_prefix) >= 3 THEN email_prefix
      ELSE 'user_' || email_prefix || '_' || substring(NEW.id::text, 1, 4)
    END
  );
  
  -- 確保最小長度為 3
  IF generated_username IS NULL OR length(generated_username) < 3 THEN
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
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'fullName', ''),
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      CASE 
        WHEN length(email_prefix) >= 2 THEN email_prefix
        ELSE 'User'
      END
    ),
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
    username = CASE 
      WHEN NEW.raw_user_meta_data->>'username' IS NOT NULL 
        AND length(NEW.raw_user_meta_data->>'username') >= 3
      THEN NEW.raw_user_meta_data->>'username'
      ELSE app_users.username
    END,
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

-- 7. 驗證修復
SELECT 
  '🔍 修復結果' as check_type,
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
  '⚠️ 缺失的 App Users',
  count(*)::text
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
UNION ALL
SELECT 
  '📏 Username 長度檢查',
  CASE 
    WHEN count(*) = 0 THEN '✅ 全部符合'
    ELSE count(*)::text || ' 個太短'
  END
FROM app_users 
WHERE length(username) < 3;

-- 8. 顯示所有用戶
SELECT 
  au.email,
  apu.username,
  length(apu.username) as username_length,
  apu.role::text as role,
  CASE 
    WHEN apu.id IS NOT NULL AND length(apu.username) >= 3 THEN '✅ OK'
    WHEN apu.id IS NOT NULL AND length(apu.username) < 3 THEN '⚠️ 用戶名太短'
    ELSE '❌ 缺失 APP_USER'
  END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;

SELECT '🎉 Username 長度問題修復完成！' as message;
