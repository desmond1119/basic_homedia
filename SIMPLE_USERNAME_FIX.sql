-- ⚡ 簡單的 Username 長度修復
-- 直接在 Supabase Dashboard SQL Editor 執行

-- 1. 檢查有問題的用戶（跳過約束檢查）
SELECT 
  '📋 問題用戶分析' as section,
  '' as email,
  '' as prefix,
  '' as length_info
UNION ALL
(
  SELECT 
    '---',
    au.email,
    split_part(au.email, '@', 1) as email_prefix,
    'length: ' || length(split_part(au.email, '@', 1))::text
  FROM auth.users au
  WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
  ORDER BY length(split_part(au.email, '@', 1))
);

-- 2. 臨時禁用 RLS
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 3. 修復所有用戶（確保 username 長度 >= 3）
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
      -- 使用 metadata 中的 username
      new_username := auth_record.raw_user_meta_data->>'username';
    ELSIF length(email_prefix) >= 3 THEN
      -- 使用 email 前綴
      new_username := email_prefix;
    ELSE
      -- email 前綴太短，生成安全的用戶名
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
      
      RAISE NOTICE '✅ 成功創建: % → username: % (長度: %)', 
        auth_record.email, new_username, length(new_username);
        
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE '❌ 創建失敗: % - 錯誤: %', auth_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '🎉 完成！共處理 % 個用戶', counter;
END $$;

-- 4. 重新啟用 RLS
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- 5. 驗證修復結果
SELECT 
  '🔍 修復結果檢查' as check_type,
  '' as value
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
  '⚠️ 仍缺失的 App Users',
  count(*)::text
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)
UNION ALL
SELECT 
  '📏 短用戶名檢查 (< 3 字符)',
  count(*)::text
FROM app_users 
WHERE length(username) < 3
UNION ALL
SELECT 
  '🔐 RLS 政策數量',
  count(*)::text
FROM pg_policies 
WHERE tablename = 'app_users';

-- 6. 顯示所有用戶狀態
SELECT 
  '👥 用戶狀態總覽' as section,
  '' as email,
  '' as username,
  '' as length_info,
  '' as status
UNION ALL
(
  SELECT 
    '---',
    au.email,
    COALESCE(apu.username, '❌ 缺失'),
    CASE 
      WHEN apu.username IS NOT NULL THEN 'len:' || length(apu.username)::text
      ELSE ''
    END,
    CASE 
      WHEN apu.id IS NOT NULL AND length(apu.username) >= 3 THEN '✅ OK'
      WHEN apu.id IS NOT NULL AND length(apu.username) < 3 THEN '⚠️ 太短'
      ELSE '❌ 缺失'
    END
  FROM auth.users au
  LEFT JOIN app_users apu ON au.id = apu.id
  ORDER BY au.created_at DESC
);

-- 7. 最終確認
SELECT 
  CASE 
    WHEN (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id)) = 0
    THEN '🎉 所有用戶修復完成！可以嘗試登入了。'
    ELSE '⚠️ 還有 ' || (SELECT count(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id))::text || ' 個用戶需要修復。'
  END as final_status;
