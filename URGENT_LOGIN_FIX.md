# 🚨 緊急登入修復指南

## 問題
用戶無法登入，顯示 "Database error granting user" 錯誤

## ⚡ 快速修復（3 步驟）

### 步驟 1：執行診斷修復腳本

1. 打開 **Supabase Dashboard**: https://supabase.com/dashboard
2. 選擇你的專案
3. 點擊左側選單的 **SQL Editor**
4. 點擊 **+ New Query**
5. 複製貼上以下檔案內容並執行：

```
/supabase/diagnose_and_fix.sql
```

6. 等待執行完成（約 10-30 秒）
7. 檢查最後的 "Final Check" 輸出，確認：
   - `auth_users` 和 `app_users` 數量相同
   - `orphans` = 0
   - `policies` >= 3
   - `triggers` = 1

### 步驟 2：檢查視圖

在同一個 SQL Editor 中執行：

```
/supabase/check_user_profiles_view.sql
```

確認輸出顯示你的用戶資料。

### 步驟 3：清除瀏覽器並重試

1. 打開開發者工具（F12）
2. 前往 **Application** > **Storage**
3. 點擊 **Clear site data**
4. 重新載入頁面
5. 嘗試登入

## 🔍 如果仍然失敗

### 檢查控制台錯誤

按 F12 打開開發者工具，查看：
- **Console** tab: 找 JavaScript 錯誤
- **Network** tab: 找失敗的請求（紅色），查看 Response

### 手動檢查特定用戶

在 Supabase SQL Editor 執行：

```sql
-- 替換成你的 email
SELECT 
  au.id as auth_id,
  au.email,
  au.created_at as auth_created,
  apu.id as app_user_id,
  apu.username,
  apu.role,
  apu.is_active
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id
WHERE au.email = 'your-email@example.com';
```

### 手動創建 app_users 記錄

如果上面的查詢顯示 `app_user_id` 是 NULL，手動創建：

```sql
-- 替換 VALUES 中的資料
INSERT INTO app_users (
  id,
  username,
  email,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT 
  au.id,
  split_part(au.email, '@', 1) || '_' || substring(md5(random()::text), 1, 4),
  au.email,
  'homeowner',
  true,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'your-email@example.com'
AND NOT EXISTS (SELECT 1 FROM app_users WHERE id = au.id);
```

### 臨時禁用 RLS 測試

```sql
-- ⚠️ 僅用於測試，完成後記得重新啟用
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;

-- 測試登入...

-- 重新啟用
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
```

## 🐛 常見問題

### Q: 執行 SQL 時出現權限錯誤
**A**: 確保你使用的是 Supabase Dashboard 的 SQL Editor，而不是直接連接資料庫。Dashboard 有必要的權限。

### Q: "orphans" 數量不是 0
**A**: 重新執行步驟 1 的腳本。它會自動為所有 orphaned users 創建 app_users 記錄。

### Q: 登入後白屏或無限載入
**A**: 這可能是前端路由問題。檢查瀏覽器控制台的錯誤訊息。

### Q: 註冊新用戶也失敗
**A**: 確認觸發器已創建：
```sql
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
```

應該看到一筆記錄且 `tgenabled` = 'O'（enabled）。

## 📝 驗證修復成功

登入成功的標誌：
1. ✅ 不再看到 "Database error granting user"
2. ✅ 登入後根據角色正確導向：
   - Admin → `/admin`
   - Provider → `/profile/{id}`
   - Homeowner → `/profile/{id}`
3. ✅ 可以看到用戶資料和介面

## 🆘 仍需協助？

如果以上步驟都無法解決，請提供：
1. Supabase SQL Editor 執行 `diagnose_and_fix.sql` 的完整輸出
2. 瀏覽器控制台的錯誤訊息（截圖）
3. Network tab 中失敗請求的 Response 內容

## 🔄 預防未來問題

修復後，確保：
- ✅ 所有新用戶註冊時觸發器會自動創建 app_users
- ✅ RLS 政策使用 SECURITY DEFINER 函數避免遞迴
- ✅ 定期檢查 orphaned users（auth.users 有但 app_users 沒有）
