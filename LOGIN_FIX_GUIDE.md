# 登入問題修復指南

## 問題描述
用戶無法登入，顯示 "Database error granting user" 錯誤。

## 根本原因
1. `handle_new_user()` 觸發器缺少 `username` 欄位，導致 NOT NULL 約束錯誤
2. RLS 政策可能造成無限遞迴
3. 註冊/登入時 profile 創建失敗

## 修復步驟

### 1. 執行 SQL 遷移

在 Supabase Dashboard 的 SQL Editor 中執行以下檔案：

```
/supabase/migrations/20251006_fix_app_users_recursion.sql
```

或複製該檔案的內容到 Supabase SQL Editor 並執行。

**重要修改：**
- 創建 `is_user_allowed()` SECURITY DEFINER 函數避免 RLS 遞迴
- 更新 RLS 政策使用該函數
- 修復 `handle_new_user()` 觸發器以自動生成 username
- 支援從 metadata 讀取所有使用者資料

### 2. 驗證修復

#### 測試註冊
```bash
# 使用新 email 註冊
# 應該自動創建 app_users 記錄
```

#### 測試登入
```bash
# 使用現有帳戶登入
# 應該正確讀取 profile 並根據角色重新導向
```

### 3. 確認資料庫狀態

在 Supabase SQL Editor 執行：

```sql
-- 檢查 RLS 政策
SELECT * FROM pg_policies WHERE tablename = 'app_users';

-- 檢查觸發器
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 檢查函數
SELECT proname, prosrc FROM pg_proc WHERE proname IN ('is_user_allowed', 'handle_new_user');

-- 檢查用戶資料
SELECT id, username, email, role FROM app_users;
```

## 程式碼修改

### AuthRepository.ts
- 在 `signUp()` 時將所有資料放入 `user_metadata`
- 在 `login()` 時添加重試邏輯
- 更好的錯誤處理

### AuthContext.tsx
- `login()` 返回 `AuthUser` 以供角色檢查
- 正確從 metadata 讀取角色

### UI Components
- `PinterestLoginPage.tsx`: 實作角色導向
- `PinterestRegisterPage.tsx`: 實作角色導向
- `ProtectedRoute.tsx`: Pinterest 風格的拒絕存取頁面

## 角色導向

登入成功後根據角色自動導向：
- `admin` → `/admin`
- `provider` → `/profile/{id}`
- `homeowner` → `/profile/{id}`
- 預設 → `/inspiration`

## 故障排除

### 如果仍然無法登入

1. **檢查 Supabase 日誌**
   - 前往 Supabase Dashboard > Logs
   - 查看 Auth 和 Database 日誌

2. **檢查 RLS 政策**
   ```sql
   -- 確認政策存在
   SELECT * FROM pg_policies WHERE tablename = 'app_users';
   ```

3. **手動創建測試用戶**
   ```sql
   -- 在 SQL Editor 執行
   INSERT INTO app_users (id, username, email, role)
   VALUES (
     'your-auth-user-id',
     'testuser',
     'test@example.com',
     'homeowner'
   );
   ```

4. **檢查 user_profiles 視圖**
   ```sql
   SELECT * FROM user_profiles WHERE email = 'your-email@example.com';
   ```

## 注意事項

- 確保 Supabase 專案已啟用 RLS
- 確保觸發器在 `auth.users` 表上正確創建
- 首次登入可能需要稍等片刻讓觸發器執行完成
- 如果問題持續，考慮清除瀏覽器快取和 Local Storage
