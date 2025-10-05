## 完整認證系統設置指南

# 裝修平台認證系統 - 完整實現指南

## 📋 目錄

1. [系統概述](#系統概述)
2. [技術架構](#技術架構)
3. [數據庫設置](#數據庫設置)
4. [認證流程](#認證流程)
5. [測試指南](#測試指南)
6. [擴展功能](#擴展功能)

---

## 系統概述

### 功能特性

✅ **多角色註冊系統**
- 房主 (Homeowner)
- 服務提供商 (Provider) - 室內設計、裝修、清潔公司
- 平台管理員 (Admin)

✅ **企業級安全**
- Supabase Auth 核心認證
- Row Level Security (RLS)
- 密碼加密存儲
- Session 管理

✅ **可擴展設計**
- 管理員可配置的服務商類型
- 嚴格的角色權限控制
- TypeScript strict mode

---

## 技術架構

### 架構層次

```
┌─────────────────────────────────────────────────────────┐
│                    UI 層 (React)                         │
│  RegisterPage, LoginPage, Dashboard, ProtectedRoute     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 狀態管理層 (Redux Toolkit)                │
│  authSlice: register/login/logout thunks                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                數據訪問層 (Repository)                    │
│  AuthRepository: 業務邏輯和驗證                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 Mapper 層                                │
│  AuthMapper: Domain ↔ Persistence 轉換                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              後端服務 (Supabase)                          │
│  Auth + PostgreSQL + RLS                                │
└─────────────────────────────────────────────────────────┘
```

### 文件結構

```
src/features/auth/
├── domain/
│   └── Auth.types.ts              # 領域類型定義
├── infrastructure/
│   ├── AuthMapper.ts              # 數據映射
│   └── AuthRepository.ts          # 數據訪問
├── store/
│   └── authSlice.ts              # Redux 狀態
└── components/
    ├── LoginPage.tsx             # 登錄頁面
    ├── RegisterPage.tsx          # 註冊頁面
    ├── Dashboard.tsx             # 儀表板
    └── ProtectedRoute.tsx        # 路由保護
```

---

## 數據庫設置

### 步驟 1: 執行 SQL 遷移

1. 登錄到 [Supabase Dashboard](https://app.supabase.com)
2. 選擇你的項目
3. 進入 **SQL Editor**
4. 複製 `supabase/migrations/002_auth_system.sql` 的完整內容
5. 點擊 **Run** 執行

### 步驟 2: 驗證數據庫結構

執行以下查詢確認表已創建：

```sql
-- 檢查表
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('app_users', 'provider_types');

-- 檢查 RLS 已啟用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 步驟 3: 生成 TypeScript 類型（可選但推薦）

```bash
# 安裝 Supabase CLI
npm install -g supabase

# 生成類型
npx supabase gen types typescript --project-id jufwllhkgtvovyazgxld > src/core/infrastructure/supabase/types.ts
```

### 數據庫模式說明

#### `app_users` 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵，關聯 auth.users |
| username | TEXT | 唯一用戶名 |
| email | TEXT | 唯一郵箱 |
| role | user_role | 'homeowner' \| 'provider' \| 'admin' |
| provider_type_id | UUID | 服務商類型（provider 角色必填） |
| full_name | TEXT | 全名 |
| phone | TEXT | 電話 |
| is_active | BOOLEAN | 帳戶狀態 |

#### `provider_types` 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| type_name | TEXT | 類型代碼（如 'interior_design'） |
| display_name | TEXT | 顯示名稱 |
| is_active | BOOLEAN | 是否啟用 |

---

## 認證流程

### 註冊流程

```typescript
// 1. 用戶填寫註冊表單
{
  username: "john_doe",
  email: "john@example.com",
  password: "SecurePass123",
  role: "provider",
  providerTypeId: "uuid-of-renovation-type"
}

// 2. Repository 驗證
- 檢查 username 是否可用 (RPC: is_username_available)
- 調用 Supabase Auth signUp
- 插入 app_users 記錄
- 處理失敗回滾

// 3. 成功返回 AuthSession
{
  user: AppUser,
  accessToken: string,
  refreshToken: string
}
```

### 登錄流程

```typescript
// 1. 用戶輸入憑證
{
  email: "john@example.com",
  password: "SecurePass123"
}

// 2. Repository 處理
- Supabase Auth signInWithPassword
- 從 user_profiles view 獲取完整資料
- 檢查 is_active 狀態

// 3. Redux 更新狀態
- 保存 user 和 session
- 設置 isAuthenticated = true
```

### Session 檢查

```typescript
// App 啟動時
- checkAuthSession() thunk
- 獲取當前 Supabase session
- 獲取用戶資料
- 更新 Redux 狀態
```

---

## 測試指南

### 1. 測試註冊功能

#### 測試案例 1: 房主註冊
```
輸入:
- Username: homeowner_test
- Email: homeowner@test.com
- Password: Test123456
- Role: Homeowner

預期結果:
✅ 註冊成功
✅ 重定向到 /dashboard
✅ Dashboard 顯示 role badge "homeowner"
```

#### 測試案例 2: 服務商註冊
```
輸入:
- Username: design_company
- Email: design@test.com
- Password: Design123456
- Role: Service Provider
- Provider Type: Interior Design Company

預期結果:
✅ 註冊成功
✅ Dashboard 顯示 provider_type
✅ app_users 表有 provider_type_id
```

#### 測試案例 3: 錯誤處理
```
測試重複用戶名:
- 用相同 username 註冊
- 應顯示 "Username is already taken"

測試重複郵箱:
- 用相同 email 註冊
- 應顯示錯誤訊息

測試弱密碼:
- 密碼少於 8 字符
- 前端驗證應阻止提交
```

### 2. 測試登錄功能

```
有效憑證:
- Email: homeowner@test.com
- Password: Test123456
- 預期: 成功登錄，重定向到 dashboard

無效憑證:
- 錯誤密碼
- 預期: 顯示 "Invalid login credentials"

停用帳戶:
- 在 Supabase 設置 is_active = false
- 預期: 登錄失敗，顯示 "Account is deactivated"
```

### 3. 測試路由保護

```
未登錄訪問 /dashboard:
- 預期: 重定向到 /login

登錄後訪問 /dashboard:
- 預期: 顯示 Dashboard

登出後:
- 預期: session 清除，重定向到 /login
```

### 4. 測試角色權限（擴展功能）

```typescript
// 在 ProtectedRoute 中測試
<ProtectedRoute allowedRoles={['admin']}>
  <AdminPanel />
</ProtectedRoute>

// 非 admin 用戶訪問
- 預期: 顯示 "Access Denied"
```

---

## 擴展功能

### 1. 添加新的服務商類型（管理員）

```sql
-- 在 Supabase SQL Editor 執行
INSERT INTO provider_types (type_name, display_name, description, created_by)
VALUES (
  'plumbing',
  'Plumbing Company',
  'Professional plumbing services',
  'admin-user-uuid'
);
```

### 2. 實現密碼重置

```typescript
// 在 AuthRepository 添加
async resetPassword(email: string): Promise<Result<boolean, Error>> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  // ...
}
```

### 3. 添加社交登錄

```typescript
// 在 AuthRepository 添加
async signInWithGoogle(): Promise<Result<AuthSession, Error>> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  // ...
}
```

### 4. Email 驗證流程

在 Supabase Dashboard:
1. **Authentication > Email Templates**
2. 配置驗證郵件模板
3. 啟用 "Confirm email"

```typescript
// 在註冊後檢查
if (user && !user.emailVerified) {
  // 顯示 "Please verify your email"
}
```

### 5. 管理員審批流程

```typescript
// 新增 admin_approvals 表
CREATE TABLE admin_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES app_users(id),
  requested_role user_role,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES app_users(id),
  reviewed_at TIMESTAMPTZ
);
```

---

## 常見問題

### Q: 如何阻止用戶自己設置為 admin？

A: 已實現在前端和 RLS 策略中：
- 註冊表單不顯示 'admin' 選項
- 後端可添加額外檢查
- 建議：admin 只能通過 Supabase Dashboard 手動設置

### Q: Session 如何自動續期？

A: Supabase 自動處理：
```typescript
// 在 client.ts 中已配置
{
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
}
```

### Q: 如何實現「記住我」功能？

A: Supabase 默認持久化 session。如需自定義：
```typescript
supabase.auth.signInWithPassword({
  email,
  password,
  options: {
    shouldPersistSession: rememberMe
  }
});
```

---

## 安全檢查清單

- [x] 密碼最少 8 字符
- [x] Email 格式驗證
- [x] Username 唯一性檢查
- [x] RLS 策略已啟用
- [x] 敏感操作需認證
- [x] Session 自動過期
- [x] 錯誤訊息不洩露用戶資訊
- [x] HTTPS only (生產環境)
- [ ] Rate limiting (建議添加)
- [ ] 2FA (可選添加)

---

## 部署前檢查

1. ✅ 執行所有 SQL 遷移
2. ✅ 配置環境變數 (.env)
3. ✅ 測試所有註冊/登錄流程
4. ✅ 驗證 RLS 策略
5. ✅ 檢查錯誤處理
6. ✅ 測試 Session 持久化
7. ⚠️ 配置 Email 模板（Supabase Dashboard）
8. ⚠️ 設置生產環境 URL 重定向

---

## 快速開始命令

```bash
# 1. 確保依賴已安裝
npm install

# 2. 配置環境變數（已完成）
# .env 已包含 Supabase 憑證

# 3. 執行 SQL 遷移
# 在 Supabase Dashboard SQL Editor 執行
# supabase/migrations/002_auth_system.sql

# 4. 啟動開發服務器
npm run dev

# 5. 測試註冊
# 訪問 http://localhost:3000/register
# 填寫表單並註冊

# 6. 測試登錄
# 訪問 http://localhost:3000/login
# 使用剛註冊的憑證登錄
```

---

## 支持

如有問題，請檢查：
1. Supabase Dashboard > Logs
2. 瀏覽器 Console
3. Network Tab (查看 API 請求)
4. Redux DevTools (查看狀態變化)

祝你使用愉快！🎉
