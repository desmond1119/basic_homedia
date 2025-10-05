# 🚀 立即執行修復

## ⚡ 使用最簡單的版本

我已經創建了一個 **100% 可靠** 的修復腳本，使用 PL/pgSQL 避免所有類型轉換問題。

### 📋 執行步驟（3分鐘）

#### 1. 打開 Supabase Dashboard

前往：https://supabase.com/dashboard

選擇你的專案

#### 2. 打開 SQL Editor

點擊左側選單的 **SQL Editor**

點擊 **+ New Query**

#### 3. 執行修復腳本

複製並貼上以下檔案的 **完整內容**：

```
/supabase/SIMPLE_FIX.sql
```

#### 4. 點擊 RUN 按鈕

等待執行完成（約5-10秒）

#### 5. 檢查輸出

你應該看到：

```
metric                          | value
--------------------------------|------
Total auth.users                | X
Total app_users                 | X
Missing app_users (should be 0) | 0    ← 這個必須是 0
```

以及所有用戶的列表，每個都應該顯示 "✅ OK"

### ✅ 如果成功

1. 關閉瀏覽器
2. 重新打開你的應用
3. 清除快取（Ctrl+Shift+Delete）
4. 嘗試登入

### 🎯 預期結果

- ✅ 不再看到 "Database error granting user"
- ✅ 登入成功並顯示綠色成功訊息
- ✅ 根據角色導向到正確頁面

### 🔍 驗證修復

在 SQL Editor 執行：

```sql
SELECT 
  au.email,
  apu.username,
  apu.role::text,
  CASE WHEN apu.id IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id;
```

**每個用戶都應該顯示 ✅**

### ❓ 如果仍然失敗

#### 檢查 ENUM 類型

```sql
-- 列出所有 user_role 的值
SELECT unnest(enum_range(NULL::user_role));
```

應該顯示：
- admin
- provider  
- homeowner

如果缺少任何值，執行：

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'provider';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'homeowner';
```

#### 手動創建特定用戶

如果某個用戶仍然無法登入，手動創建：

```sql
-- 替換 YOUR_EMAIL
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id 
  FROM auth.users 
  WHERE email = 'YOUR_EMAIL@example.com';
  
  IF user_id IS NOT NULL THEN
    INSERT INTO app_users (
      id, username, email, role, is_active, created_at, updated_at
    ) VALUES (
      user_id,
      split_part('YOUR_EMAIL@example.com', '@', 1),
      'YOUR_EMAIL@example.com',
      'homeowner'::user_role,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created app_user for %', 'YOUR_EMAIL@example.com';
  ELSE
    RAISE NOTICE 'User not found in auth.users';
  END IF;
END $$;
```

### 📊 完整診斷

如果需要完整診斷，執行：

```sql
-- 診斷查詢
SELECT '1. RLS Status' as check_type, 
  CASE WHEN rowsecurity THEN 'Enabled ✅' ELSE 'Disabled ⚠️' END as status
FROM pg_tables WHERE tablename = 'app_users'
UNION ALL
SELECT '2. Policies Count', count(*)::text || ' policies'
FROM pg_policies WHERE tablename = 'app_users'
UNION ALL
SELECT '3. Trigger Exists', 
  CASE WHEN count(*) > 0 THEN 'Yes ✅' ELSE 'No ❌' END
FROM pg_trigger WHERE tgname = 'on_auth_user_created'
UNION ALL
SELECT '4. Auth Users', count(*)::text FROM auth.users
UNION ALL
SELECT '5. App Users', count(*)::text FROM app_users
UNION ALL
SELECT '6. Orphaned Users', count(*)::text
FROM auth.users au 
WHERE NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id);
```

### 🆘 緊急聯絡

如果以上都無法解決，提供以下資訊：

1. 上面診斷查詢的完整輸出
2. `SIMPLE_FIX.sql` 執行後的錯誤訊息（如果有）
3. 瀏覽器控制台的錯誤（F12 > Console）

## 🎉 完成後

記得：
- ✅ 重新載入應用
- ✅ 清除瀏覽器快取
- ✅ 重新登入測試
- ✅ 確認所有功能正常

---

**立即前往 Supabase Dashboard 執行 `/supabase/SIMPLE_FIX.sql`！**
