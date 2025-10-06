# 管理員登入導航修復

## 問題
- n46angle@gmail.com 管理員登入後沒有自動導航到 `/admin` 頁面
- 左側欄沒有顯示管理員儀表板連結

## 已修復

### 1. SidebarNav.tsx
✅ 添加管理員儀表板連結
- 路徑: `/admin`
- 圖標: ShieldCheckIcon
- 標籤: `t('nav.admin')`
- 僅對 `admin` 角色顯示
- 位置: 在 Analytics 和 Messages 之間

✅ 修復 active 狀態檢測
- `/admin` 路徑會正確匹配 `/admin` 和 `/admin/*`

### 2. 翻譯文件
✅ **en.json**
```json
"nav": {
  "admin": "Admin Dashboard"
}
```

✅ **zh-TW.json**
```json
"nav": {
  "admin": "管理員儀表板"
}
```

✅ **zh-CN.json**
```json
"nav": {
  "admin": "管理员仪表板"
}
```

### 3. PinterestLoginPage.tsx
✅ 登入後的角色導航邏輯已存在且正確：
```typescript
const redirectPath = user.role === 'admin' 
  ? '/admin' 
  : user.role === 'provider'
  ? '/profile/' + user.id
  : user.role === 'homeowner'
  ? '/profile/' + user.id
  : '/inspiration';
```

## 驗證步驟

### 1. 確認管理員角色
在 Supabase SQL Editor 執行：
```sql
SELECT id, email, username, role FROM app_users WHERE email = 'n46angle@gmail.com';
```

應該顯示 `role = 'admin'`

如果不是，執行：
```sql
UPDATE app_users SET role = 'admin' WHERE email = 'n46angle@gmail.com';
```

### 2. 測試登入流程
1. 登出當前用戶
2. 使用 `n46angle@gmail.com` 登入
3. 應該自動導航到 `/admin` 頁面
4. 左側欄應該顯示「管理員儀表板」按鈕

### 3. 檢查側邊欄
管理員登入後，左側欄應該顯示：
- ✅ 靈感 (Inspiration)
- ✅ 瀏覽 (Browse)
- ✅ 社群 (Forum)
- ✅ 個人檔案 (Profile)
- ✅ 數據分析 (Analytics)
- ✅ **管理員儀表板 (Admin Dashboard)** ← 新增
- ✅ 訊息 (Messages)
- ✅ 設定 (Settings)

## 側邊欄導航順序

```typescript
const navItems = [
  { key: 'inspiration', path: '/inspiration' },           // 所有人
  { key: 'browse', path: '/providers' },                  // 所有人
  { key: 'forum', path: '/forum' },                       // 所有人
  { key: 'profile', path: '/profile/:id' },               // 已登入
  { key: 'collections', path: '/collections' },           // homeowner
  { key: 'demands', path: '/demands' },                   // homeowner
  { key: 'upload', path: '/portfolio/upload' },           // provider
  { key: 'analytics', path: '/analytics' },               // provider, admin
  { key: 'admin', path: '/admin' },                       // admin ← 新增
  { key: 'messages', path: '/messages' },                 // 已登入
  { key: 'settings', path: '/settings' },                 // 已登入
];
```

## 路由配置

確認 `/admin` 路由已在 `App.tsx` 中配置：
```typescript
<Route
  path="/admin/*"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardPage />
    </ProtectedRoute>
  }
/>
```

## Troubleshooting

### 問題: 登入後沒有導航到 /admin
**檢查:**
1. 用戶的 `role` 是否為 `'admin'`
2. Console 是否有錯誤訊息
3. 檢查 `login` 函數返回的 user 對象

### 問題: 側邊欄沒有顯示管理員連結
**檢查:**
1. 用戶是否已登入
2. `user.role` 是否為 `'admin'`
3. Redux state 中的 `auth.user` 是否正確

### 問題: 點擊管理員連結後 404
**檢查:**
1. `/admin` 路由是否在 `App.tsx` 中配置
2. `AdminDashboardPage` 組件是否存在
3. `ProtectedRoute` 是否正常運作

## 相關檔案

- `src/shared/components/SidebarNav.tsx` - 側邊欄導航
- `src/features/auth/components/PinterestLoginPage.tsx` - 登入頁面
- `src/locales/en.json` - 英文翻譯
- `src/locales/zh-TW.json` - 繁體中文翻譯
- `src/locales/zh-CN.json` - 簡體中文翻譯
- `supabase/migrations/004_restore_roles_and_admin.sql` - 管理員角色設置

## 完成 ✅

管理員登入後現在會：
1. ✅ 自動導航到 `/admin` 頁面
2. ✅ 在左側欄顯示「管理員儀表板」連結
3. ✅ 正確高亮當前活動的管理員頁面
