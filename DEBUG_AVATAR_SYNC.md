# 頭像同步問題調試指南

## 問題描述
頭像已成功上傳到 Supabase Storage，但在頁面中不顯示。

## 調試步驟

### 1. 檢查瀏覽器控制台
打開瀏覽器開發者工具 (F12)，查看 Console 標籤：

**預期日誌**:
```
Starting avatar upload... { userId: "xxx", fileName: "image.png", fileSize: 12345 }
Uploading avatar: xxx/avatar-1234567890.png Size: 12345 Type: image/png
Avatar uploaded successfully: { path: "xxx/avatar-1234567890.png" }
Avatar public URL: https://xxx.supabase.co/storage/v1/object/public/avatars/xxx/avatar-1234567890.png
Avatar uploaded, URL: https://...
Profile update result: { ... }
```

**檢查錯誤**:
- 如果看到 "Upload failed: ..." - Storage 權限問題
- 如果看到 "Failed to update profile: ..." - 數據庫更新問題
- 如果看到 "Failed to load avatar: ..." - URL 無效或無法訪問

### 2. 檢查 Redux Store 狀態

在控制台執行：
```javascript
// 檢查當前用戶狀態
console.log('Auth User:', window.__REDUX_DEVTOOLS_EXTENSION__?.store?.getState().auth.user);

// 檢查個人資料狀態
console.log('Current Profile:', window.__REDUX_DEVTOOLS_EXTENSION__?.store?.getState().userProfile.currentProfile);
```

**預期結果**:
- `auth.user.avatarUrl` 應該包含新的頭像 URL
- `userProfile.currentProfile.avatarUrl` 應該包含新的頭像 URL

### 3. 檢查數據庫

在 Supabase Dashboard -> SQL Editor 執行：

```sql
-- 檢查用戶的 avatar_url
SELECT id, username, email, avatar_url, updated_at
FROM app_users
WHERE email = 'your-email@example.com';
```

**預期結果**:
- `avatar_url` 欄位應該包含完整的 URL
- `updated_at` 應該是最近的時間戳

### 4. 檢查 Storage URL

複製 Storage 中的頭像 URL，在新瀏覽器標籤中打開：

**預期結果**:
- 應該能直接看到圖片
- 如果看到 "Access Denied" - RLS 策略問題
- 如果看到 404 - 文件不存在

### 5. 測試 Storage 訪問

在控制台執行：
```javascript
// 測試獲取公共 URL
const { data } = supabase.storage.from('avatars').getPublicUrl('your-user-id/avatar-xxx.png');
console.log('Public URL:', data.publicUrl);

// 測試下載文件
const { data: downloadData, error } = await supabase.storage.from('avatars').download('your-user-id/avatar-xxx.png');
console.log('Download result:', { data: downloadData, error });
```

## 常見問題和解決方案

### 問題 1: 頭像上傳成功但數據庫未更新
**症狀**: Storage 中有文件，但 `app_users.avatar_url` 為空

**解決方案**:
```javascript
// 手動更新數據庫
const avatarUrl = 'https://xxx.supabase.co/storage/v1/object/public/avatars/xxx/avatar-xxx.png';
await supabase.from('app_users').update({ avatar_url: avatarUrl }).eq('id', 'your-user-id');
```

### 問題 2: Redux Store 未更新
**症狀**: 數據庫有正確的 URL，但 UI 不顯示

**解決方案**:
1. 刷新頁面
2. 檢查 `fetchUserProfile` 是否被調用
3. 檢查 Redux DevTools 中的 actions

### 問題 3: 圖片 URL 無法訪問
**症狀**: 控制台顯示 "Failed to load avatar"

**解決方案**:
1. 檢查 bucket 是否設為 public
2. 檢查 RLS 策略是否允許 SELECT
3. 運行 `006_fix_avatar_storage.sql` 遷移

### 問題 4: CORS 錯誤
**症狀**: 控制台顯示 CORS 相關錯誤

**解決方案**:
在 Supabase Dashboard -> Storage -> Configuration 中添加允許的來源：
- `http://localhost:3000`
- `http://localhost:5173`

## 手動修復步驟

如果自動同步失敗，可以手動修復：

### 步驟 1: 獲取最新的頭像 URL
```sql
SELECT avatar_url FROM app_users WHERE id = 'your-user-id';
```

### 步驟 2: 在控制台強制更新 Redux
```javascript
// 獲取最新資料
await dispatch(fetchUserProfile('your-user-id'));

// 或手動設置
dispatch(setAuthUser({
  ...currentUser,
  avatarUrl: 'https://xxx.supabase.co/storage/v1/object/public/avatars/xxx/avatar-xxx.png'
}));
```

### 步驟 3: 清除瀏覽器緩存
1. 打開開發者工具
2. 右鍵點擊刷新按鈕
3. 選擇 "清空緩存並硬性重新載入"

## 代碼修復

### 已修復的問題

1. ✅ **添加 key 屬性**: 強制 React 在 URL 變化時重新渲染圖片
```tsx
<img key={currentProfile.avatarUrl} src={currentProfile.avatarUrl} ... />
```

2. ✅ **改進錯誤處理**: 添加詳細的控制台日誌
```typescript
console.log('Starting avatar upload...', { userId, fileName, fileSize });
console.log('Avatar uploaded, URL:', avatarUrl);
console.log('Profile update result:', updateResult);
```

3. ✅ **確保更新流程**: 上傳 → 更新數據庫 → 刷新資料 → 更新 Redux
```typescript
const result = await dispatch(uploadUserAvatar({ userId, file }));
await dispatch(updateUserProfile({ userId, data: { avatarUrl } }));
await dispatch(fetchUserProfile(userId));
```

4. ✅ **實時訂閱**: 監聽數據庫變化並自動更新 UI
```typescript
supabase.channel(`profile:${userId}`)
  .on('postgres_changes', { event: 'UPDATE', table: 'app_users' }, ...)
```

## 測試清單

- [ ] 上傳頭像後，控制台顯示完整的日誌
- [ ] Redux Store 中的 `auth.user.avatarUrl` 更新
- [ ] Redux Store 中的 `userProfile.currentProfile.avatarUrl` 更新
- [ ] 數據庫 `app_users.avatar_url` 欄位更新
- [ ] Storage 中存在文件
- [ ] 頭像 URL 可以直接在瀏覽器中訪問
- [ ] EditProfileForm 中的頭像立即更新
- [ ] UserProfilePage 中的頭像立即更新
- [ ] SidebarNav 中的頭像立即更新
- [ ] 刷新頁面後頭像仍然顯示

## 下一步

如果問題仍然存在：

1. **打開瀏覽器控制台**，上傳頭像，複製所有日誌
2. **檢查 Network 標籤**，查看 API 請求和響應
3. **檢查 Redux DevTools**，查看 actions 和 state 變化
4. **提供錯誤信息**，以便進一步診斷
