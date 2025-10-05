# 個人檔案無法顯示 - 完整修復指南

## 問題診斷
從 Console 錯誤看到：
```
401 Error: Failed to fetch from app_users
PostgrestError: new row violates row-level security policy
```

**根本原因**：RLS (Row Level Security) 策略阻擋了用戶查看自己的資料。

## 立即修復步驟

### 步驟 1: 在 Supabase SQL Editor 執行修復

1. **打開 Supabase SQL Editor**
   ```
   https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql
   ```

2. **複製並執行以下 SQL**（檔案：`supabase/migrations/FIX_PROFILE_RLS.sql`）

```sql
-- 刪除所有現有的 app_users RLS 策略
DROP POLICY IF EXISTS "Auth users can insert" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.app_users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;

-- 創建新的 RLS 策略

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

-- 允許任何人查看 provider 的公開資料
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

-- 確認 RLS 已啟用
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 測試查詢
SELECT 
  'Success! Can fetch own user data' as status,
  id,
  username,
  email,
  role
FROM public.app_users
WHERE id = auth.uid()
LIMIT 1;
```

3. **確認執行成功**
   - 應該看到 "Success! Can fetch own user data" 和你的用戶資料
   - 如果看到錯誤，請把錯誤訊息告訴我

### 步驟 2: 清除瀏覽器緩存並重新測試

1. **完全重新載入頁面**
   - Mac: Cmd+Shift+R
   - Windows: Ctrl+Shift+R
   - 或使用隱私模式

2. **重新登入**
   - 登出後重新登入（確保 session 更新）

3. **點擊個人檔案頭像**
   - 應該能看到個人檔案頁面

4. **查看 Console**
   - 應該看到：
     ```
     Fetching profile for user: [你的user_id]
     Current session user: [你的user_id]
     User data fetched successfully: [你的username]
     Profile data assembled: [你的username]
     ```

## 如果仍然失敗

### 診斷步驟

1. **檢查 Supabase Auth 狀態**
   在瀏覽器 Console 執行：
   ```javascript
   const { data, error } = await supabase.auth.getSession();
   console.log('Session:', data.session);
   console.log('User ID:', data.session?.user.id);
   ```

2. **檢查用戶是否在 app_users 表中**
   在 Supabase SQL Editor 執行：
   ```sql
   SELECT * FROM public.app_users 
   WHERE id = auth.uid();
   ```

3. **檢查 RLS 策略**
   在 Supabase SQL Editor 執行：
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'app_users'
   ORDER BY policyname;
   ```

### 可能的問題與解決方案

#### 問題 1: Session 過期
**症狀**: Console 顯示 "No active session"

**解決方案**:
1. 登出
2. 清除瀏覽器緩存
3. 重新登入

#### 問題 2: 用戶不在 app_users 表中
**症狀**: SQL 查詢返回空結果

**解決方案**: 在 Supabase SQL Editor 執行
```sql
INSERT INTO public.app_users (id, username, email, role)
SELECT 
  auth.uid(),
  COALESCE(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  email,
  'homeowner'
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
```

#### 問題 3: RLS 策略未正確設置
**症狀**: 401 或 403 錯誤

**解決方案**: 重新執行 `FIX_PROFILE_RLS.sql`

## 驗證修復成功

執行測試腳本：
```bash
node scripts/testProfile.mjs
```

應該看到：
```
✅ 已登入用戶 ID: [你的ID]
✅ app_users 查詢成功
   Username: [你的username]
   Email: [你的email]
   Role: homeowner
```

## 技術說明

### RLS 策略的重要性

Row Level Security (RLS) 是 PostgreSQL 的安全機制：
- **保護資料**: 防止用戶查看不該看的資料
- **細粒度控制**: 可以針對不同操作（SELECT, INSERT, UPDATE, DELETE）設置不同策略
- **基於角色**: 可以區分 authenticated, anon, service_role 等角色

### 為什麼之前會失敗

1. **策略過於嚴格**: `WITH CHECK (auth.uid() = id)` 只允許 INSERT，沒有允許 SELECT
2. **角色未指定**: 沒有明確指定 `TO authenticated`
3. **策略衝突**: 多個策略可能互相衝突

### 新策略的改進

1. **明確角色**: `TO authenticated` 明確指定已認證用戶
2. **完整權限**: 分別設置 SELECT, INSERT, UPDATE 策略
3. **公開資料**: 允許查看 provider 的公開資料（用於搜尋功能）

## 後續優化

修復後，還可以：

1. **啟用統計功能**
   - 創建 `follows`, `posts`, `bookmarks` 表
   - 執行 `FIX_PROFILE_ISSUES.sql`
   - 更新前端代碼重新啟用統計查詢

2. **添加頭像上傳**
   - 創建 `avatars` Storage bucket
   - 設置 Storage 權限策略

3. **優化效能**
   - 使用 RPC 函數批量查詢
   - 添加 Redis 緩存

## 需要幫助？

如果執行後仍有問題，請提供：
1. Supabase SQL Editor 執行結果的截圖
2. 瀏覽器 Console 的完整錯誤訊息
3. `node scripts/testProfile.mjs` 的輸出
4. 用戶的 ID（從 Console 中獲取）

---

**最後更新**: 2025-10-06
**狀態**: 等待用戶執行 SQL 修復並回報結果
