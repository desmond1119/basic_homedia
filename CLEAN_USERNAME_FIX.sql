-- 🔧 最乾淨的 Username 修復腳本
-- 直接在 Supabase Dashboard SQL Editor 執行

-- 1. 檢查有問題的用戶
SELECT 
  au.email,
  split_part(au.email, '@', 1) as email_prefix,
  length(split_part(au.email, '@', 1)) as prefix_length
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
ORDER BY length(split_part(au.email, '@', 1));

-- 2. 臨時禁用 RLS
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 3. 修復所有用戶
DO $$
DECLARE
  auth_record RECORD;
  new_username TEXT;
  user_role_val user_role;
  counter INTEGER := 0;
  email_prefix TEXT;
BEGIN
  RAISE NOTICE '🚀 開始修復用戶名長度問題...';
  
  FOR auth_record IN 
    SELECT id, email, raw_user_meta_data, created_at, email_confirmed_at
    FROM auth.users
    WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = auth.users.id)
  LOOP
    counter := counter + 1;
    
    -- 獲取 email 前綴
    email_prefix := split_part(auth_record.email, '@', 1);
    
    -- 智能生成用戶名（確保長度 >= 3）
    IF auth_record.raw_user_meta_data->>'username' IS NOT NULL 
       AND length(auth_record.raw_user_meta_data->>'username') >= 3 THEN
      new_username := auth_record.raw_user_meta_data->>'username';
    ELSIF length(email_prefix) >= 3 THEN
      new_username := email_prefix;
    ELSE
      new_username := 'user_' || email_prefix || '_' || substring(auth_record.id::text, 1, 4);
    END IF;
    
    -- 最後的安全檢查
    IF length(new_username) < 3 THEN
      new_username := 'user_' || substring(auth_record.id::text, 1, 8);
    END IF;
    
    -- 確保唯一性
    WHILE EXISTS (SELECT 1 FROM app_users WHERE username = new_username) LOOP
      new_username := new_username || '_' || substring(md5(random()::text), 1, 3);
    END LOOP;
    
    -- 設定角色
    user_role_val := CASE 
      WHEN auth_record.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN auth_record.raw_user_meta_data->>'role' = 'provider' THEN 'provider'::user_role
      ELSE 'homeowner'::user_role
    END;
    
    -- 插入記錄
    BEGIN
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
            WHEN length(email_prefix) >= 2 THEN initcap(email_prefix)
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
      
      RAISE NOTICE '✅ 成功: % → %', auth_record.email, new_username;
        
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ 失敗: % - %', auth_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '🎉 完成！共處理 % 個用戶', counter;
END $$;

-- 4. 重新啟用 RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 5. 檢查修復結果
SELECT 
  'Auth Users' as metric,
  count(*)::text as value
FROM auth.users
UNION ALL
SELECT 
  'App Users',
  count(*)::text
FROM app_users
UNION ALL
SELECT 
  'Missing App Users',
  count(*)::text
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
UNION ALL
SELECT 
  'Short Usernames',
  count(*)::text
FROM app_users 
WHERE length(username) < 3;

-- 6. 顯示所有用戶
SELECT 
  au.email,
  apu.username,
  length(apu.username) as len,
  apu.role::text as role,
  CASE 
    WHEN apu.id IS NOT NULL AND length(apu.username) >= 3 THEN '✅'
    WHEN apu.id IS NOT NULL THEN '⚠️'
    ELSE '❌'
  END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
ORDER BY au.created_at DESC;

-- 7. 最終狀態
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)) = 0
    THEN '🎉 修復完成！可以登入了！'
    ELSE '⚠️ 還有問題需要處理'
  END as status;
