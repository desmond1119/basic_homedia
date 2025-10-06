# 頭像顯示問題修復指南

## 問題描述
用戶上傳了頭像照片，但是頭像照片沒有正確地顯示出來，顯示為 "Avatar" 文字。

## 根本原因
1. **Supabase Storage RLS 策略缺失** - avatars bucket 沒有正確的 RLS 策略來允許公開訪問
2. **圖片加載錯誤處理不足** - 前端沒有適當的錯誤處理和 fallback 機制

## 修復步驟

### 步驟 1: 更新 Supabase Storage 策略

在 Supabase SQL Editor 中執行以下 SQL：

```sql
-- 1. 確保 avatars bucket 是公開的
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
WHERE id = 'avatars';

-- 2. 刪除舊的策略
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update an avatar" ON storage.objects;

-- 3. 創建新的公開訪問策略
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 4. 允許已認證用戶上傳
CREATE POLICY "Anyone can upload an avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 5. 允許已認證用戶更新
CREATE POLICY "Anyone can update an avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');
```

### 步驟 2: 運行遷移文件

```bash
# 如果使用 Supabase CLI
supabase db push

# 或者手動在 Supabase Dashboard 執行
# 打開 SQL Editor，執行 supabase/migrations/005_setup_storage_avatars.sql
```

### 步驟 3: 驗證現有頭像 URL

在 Supabase SQL Editor 中執行：

```sql
SELECT 
  id,
  username,
  avatar_url,
  CASE 
    WHEN avatar_url IS NULL THEN 'No avatar'
    WHEN avatar_url LIKE '%/storage/v1/object/public/avatars/%' THEN 'Valid URL'
    ELSE 'Invalid URL'
  END as url_status
FROM app_users
WHERE avatar_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### 步驟 4: 測試頭像上傳

1. 登入應用
2. 進入個人資料頁面
3. 點擊「編輯個人資料」
4. 上傳新頭像
5. 檢查瀏覽器控制台是否有錯誤
6. 確認頭像正確顯示

## 已修復的代碼

### 1. Storage Migration (005_setup_storage_avatars.sql)
- ✅ 添加了完整的 RLS 策略
- ✅ 公開讀取訪問
- ✅ 已認證用戶上傳/更新權限

### 2. UserProfilePage.tsx
- ✅ 添加了 `onError` 處理器
- ✅ 圖片加載失敗時自動顯示 fallback
- ✅ 控制台錯誤日誌

### 3. EditProfileModal.tsx
- ✅ 添加了 `onError` 和 `onLoad` 處理器
- ✅ 調試日誌輸出
- ✅ 圖片加載失敗時隱藏

## 調試技巧

### 檢查 Storage URL
在瀏覽器控制台執行：
```javascript
// 檢查當前用戶的頭像 URL
console.log(document.querySelector('img[alt="Avatar"]')?.src);
```

### 檢查 Storage 權限
在 Supabase Dashboard:
1. 進入 Storage > avatars bucket
2. 點擊 Policies 標籤
3. 確認有 "Avatar images are publicly accessible" 策略
4. 確認策略狀態為 Enabled

### 測試直接訪問
複製頭像 URL 並在新標籤頁打開：
- ✅ 如果圖片顯示 = Storage 設置正確
- ❌ 如果顯示錯誤 = Storage 策略問題

## 常見問題

### Q: 頭像上傳成功但不顯示
A: 檢查 Storage RLS 策略是否正確設置，執行步驟 1 的 SQL

### Q: 控制台顯示 CORS 錯誤
A: 確保 bucket 設置為 `public = true`

### Q: 圖片 URL 格式錯誤
A: 檢查 `ProfileRepository.ts` 中的 `getPublicUrl` 調用

### Q: 舊頭像仍然顯示
A: 清除瀏覽器緩存或在 URL 後添加時間戳參數

## 驗證清單

- [ ] Supabase Storage avatars bucket 設置為 public
- [ ] RLS 策略已創建並啟用
- [ ] 遷移文件已執行
- [ ] 前端錯誤處理已添加
- [ ] 測試上傳新頭像
- [ ] 測試在不同頁面顯示頭像
- [ ] 檢查瀏覽器控制台無錯誤
- [ ] 測試圖片直接訪問 URL

## 相關文件

- `supabase/migrations/005_setup_storage_avatars.sql` - Storage 設置
- `src/features/profile/infrastructure/ProfileRepository.ts` - 頭像上傳邏輯
- `src/features/profile/components/UserProfilePage.tsx` - 頭像顯示
- `src/features/profile/components/EditProfileModal.tsx` - 頭像編輯
- `AVATAR_DISPLAY_FIX.sql` - 快速修復 SQL 腳本
