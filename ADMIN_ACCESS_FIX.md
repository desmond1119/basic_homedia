# 管理員帳號無法存取 /admin 頁面 - 修復指南

## 🔍 問題診斷

### 症狀
- 管理員帳號 `n46angle@gmail.com` 登入後
- 應該導向到 `/admin` 頁面
- 實際顯示：🚫 拒絕存取

### 根本原因
**ProtectedRoute 檢查用戶 role，但資料庫中該用戶的 role 不是 'admin'**

## 🔬 診斷流程

### 1️⃣ 檢查資料庫中的 role

在 Supabase SQL Editor 執行：

```sql
-- 查看該用戶的 role
SELECT id, email, username, role, is_active
FROM app_users 
WHERE email = 'n46angle@gmail.com';
```

**預期結果**：
- `role` 應該是 `admin`
- `is_active` 應該是 `true`

**如果 role 不是 'admin'**：這就是問題所在！

### 2️⃣ 檢查登入邏輯

ProtectedRoute.tsx (第 48 行)：
```typescript
if (allowedRoles && user && !allowedRoles.includes(user.role)) {
  // 顯示拒絕存取
}
```

App.tsx (第 104 行)：
```typescript
<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboardPage />
</ProtectedRoute>
```

**流程**：
1. 用戶登入
2. AuthRepository 從 `user_profiles` view 讀取資料
3. AuthMapper 將 `profile.role` 映射為 `AppUser.role`
4. ProtectedRoute 檢查 `user.role` 是否在 `allowedRoles` 中
5. 如果不是 → 顯示拒絕存取

## ✅ 修復步驟

### 方法 1: 在 Supabase Dashboard 修復 (推薦)

#### Step 1: 執行修復 SQL

在 Supabase SQL Editor 執行：

```sql
-- 更新為 admin role
UPDATE app_users 
SET role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'n46angle@gmail.com';

-- 驗證
SELECT id, email, username, role FROM app_users WHERE email = 'n46angle@gmail.com';
```

或直接執行檔案：
```
supabase/FIX_ADMIN_ROLE.sql
```

#### Step 2: 登出並重新登入

1. **清除瀏覽器快取**：`Cmd+Shift+Delete`
2. **登出**當前帳號
3. **重新登入** `n46angle@gmail.com`
4. ✅ 應該自動導向到 `/admin`

### 方法 2: 在 Supabase Table Editor 手動修改

1. 前往 Supabase Dashboard
2. 選擇 **Table Editor**
3. 找到 `app_users` 表
4. 搜尋 `n46angle@gmail.com`
5. 編輯該行，將 `role` 改為 `admin`
6. 儲存
7. 登出並重新登入

## 🔄 完整登入流程

```
用戶輸入帳號密碼
    ↓
supabase.auth.signInWithPassword()
    ↓
AuthRepository.login()
    → 查詢 user_profiles view
    → WHERE id = auth.user.id
    ↓
user_profiles view 回傳資料
    {
      id: "...",
      email: "n46angle@gmail.com",
      role: "admin",  ← 必須是這個值
      ...
    }
    ↓
AuthMapper.toAppUser()
    → 映射 role: profile.role as AppUser['role']
    ↓
authSlice 更新 state.user
    {
      role: "admin"
    }
    ↓
PinterestLoginPage 檢查 user.role
    → if (user.role === 'admin') navigate('/admin')
    ↓
ProtectedRoute 檢查 allowedRoles
    → if (!allowedRoles.includes(user.role)) → 拒絕
    ↓
✅ 如果 role = 'admin' → 顯示 AdminDashboardPage
❌ 如果 role ≠ 'admin' → 顯示拒絕存取
```

## 🧪 驗證修復

### 測試 1: 檢查資料庫
```sql
SELECT id, email, username, role FROM app_users WHERE email = 'n46angle@gmail.com';
```
✅ role 應該是 `admin`

### 測試 2: 登入流程
1. 前往 `/login`
2. 登入 `n46angle@gmail.com`
3. ✅ 應該自動導向到 `/admin`
4. ✅ 應該看到管理員儀表板

### 測試 3: 直接存取
1. 登入後
2. 手動前往 `http://localhost:3001/admin`
3. ✅ 應該顯示管理員頁面
4. ❌ 如果顯示拒絕存取 → role 仍然不對

### 測試 4: 檢查 Redux State
1. 登入後
2. 打開瀏覽器 Console (F12)
3. 執行：
```javascript
// 檢查 Redux state
window.__REDUX_DEVTOOLS_EXTENSION__ && console.log(
  JSON.parse(localStorage.getItem('persist:root')).auth
);
```
4. ✅ 應該看到 `"role":"admin"`

## 🐛 問題排查

### Q1: 修改後登入仍然拒絕存取

**原因**: Session 快取未清除

**解決**:
```bash
# 方法 1: 清除瀏覽器所有資料
Cmd+Shift+Delete → 選擇「所有時間」→ 清除

# 方法 2: 清除 localStorage
F12 → Application → Local Storage → Clear All

# 方法 3: 使用無痕模式測試
Cmd+Shift+N (Chrome) 或 Cmd+Shift+P (Firefox)
```

### Q2: SQL 執行後 role 仍是 homeowner

**檢查**:
```sql
-- 確認 enum 類型是否包含 'admin'
SELECT unnest(enum_range(NULL::user_role));
```

應該看到：
- admin
- provider
- homeowner

**如果缺少 'admin'**:
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
```

### Q3: user_profiles view 沒有更新

**user_profiles 是 view，會自動反映 app_users 的變更**

驗證：
```sql
-- 檢查 view
SELECT id, email, role FROM user_profiles WHERE email = 'n46angle@gmail.com';

-- 如果不對，重新創建 view
DROP VIEW IF EXISTS user_profiles;
CREATE VIEW user_profiles AS
SELECT au.* FROM app_users au;
```

## 📝 新增管理員帳號

如需新增其他管理員：

```sql
-- 方法 1: 更新現有用戶
UPDATE app_users 
SET role = 'admin'::user_role
WHERE email = '新管理員@example.com';

-- 方法 2: 在註冊時指定 (需要修改註冊邏輯)
-- 或在 raw_user_meta_data 中設置 role: 'admin'
```

## ✅ 驗收標準

- [ ] 資料庫中 `n46angle@gmail.com` 的 role 是 `admin`
- [ ] 登入後自動導向到 `/admin`
- [ ] 可以存取 `/admin` 頁面
- [ ] 側邊欄顯示「管理」選單
- [ ] Console 無錯誤訊息
- [ ] Redux state 中 user.role 是 'admin'

## 🚀 快速修復指令

```sql
-- 一鍵修復 (複製貼到 Supabase SQL Editor)
UPDATE app_users 
SET role = 'admin'::user_role, updated_at = NOW()
WHERE email = 'n46angle@gmail.com';

SELECT 
  '✅ Role updated to: ' || role as message,
  email, username
FROM app_users 
WHERE email = 'n46angle@gmail.com';
```

執行後：
1. ✅ 看到 "Role updated to: admin"
2. ✅ 登出
3. ✅ 清除快取
4. ✅ 重新登入
5. ✅ 應該進入管理員頁面

---

**最後更新**: 2025-10-06  
**狀態**: 等待用戶執行 SQL 修復
