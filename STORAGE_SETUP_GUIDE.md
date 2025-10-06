# Storage 頭像上傳設置指南

## 問題
用戶無法上傳個人檔案頭像相片
錯誤: `ERROR: 42501: must be owner of table objects`

## 解決方案

Storage RLS 政策需要通過 **Supabase Dashboard** 設置，而不是 SQL migration。

---

## 步驟 1: 創建 Avatars Bucket

### 方法 A: 使用 SQL Editor（推薦）

在 **Supabase Dashboard** → **SQL Editor** 執行：

```sql
-- 創建 avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
```

### 方法 B: 使用 Dashboard UI

1. 前往 **Supabase Dashboard** → **Storage**
2. 點擊 **New bucket**
3. 設置：
   - Name: `avatars`
   - Public bucket: ✅ **啟用**
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: 
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/gif`
     - `image/webp`

---

## 步驟 2: 設置 Storage Policies

前往 **Supabase Dashboard** → **Storage** → **Policies** → **avatars bucket**

### Policy 1: Public Read (任何人可查看)

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

**或使用 UI:**
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'avatars'`

---

### Policy 2: Authenticated Upload (用戶上傳自己的頭像)

```sql
CREATE POLICY "Users can upload avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**或使用 UI:**
- Policy name: `Users can upload avatar`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- WITH CHECK expression: 
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

---

### Policy 3: Authenticated Update (用戶更新自己的頭像)

```sql
CREATE POLICY "Users can update avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**或使用 UI:**
- Policy name: `Users can update avatar`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

---

### Policy 4: Authenticated Delete (用戶刪除自己的頭像)

```sql
CREATE POLICY "Users can delete avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**或使用 UI:**
- Policy name: `Users can delete avatar`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
  ```sql
  bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

---

## 步驟 3: 驗證設置

### 檢查 Bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

應該顯示：
- `id`: avatars
- `name`: avatars
- `public`: true
- `file_size_limit`: 5242880
- `allowed_mime_types`: {image/jpeg, image/jpg, image/png, image/gif, image/webp}

### 檢查 Policies

```sql
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

應該看到 4 個政策：
1. Public Access (SELECT)
2. Users can upload avatar (INSERT)
3. Users can update avatar (UPDATE)
4. Users can delete avatar (DELETE)

---

## 步驟 4: 測試上傳

### 在應用中測試

1. 登入應用
2. 前往個人檔案編輯頁面
3. 點擊頭像上的相機圖標
4. 選擇圖片（< 5MB, JPEG/PNG/GIF/WebP）
5. 點擊「儲存」

### 檢查 Console

打開瀏覽器 Console，應該看到：

```
Uploading avatar: <userId>/avatar-<timestamp>.<ext> Size: <bytes> Type: image/...
Avatar uploaded: { path: '...', id: '...', fullPath: '...' }
Avatar URL: https://...supabase.co/storage/v1/object/public/avatars/...
```

### 驗證儲存

在 **Supabase Dashboard** → **Storage** → **avatars** 中應該看到：
```
<userId>/
  └── avatar-<timestamp>.<ext>
```

---

## 常見問題

### ❌ Error: "new row violates row-level security policy"

**原因:** Storage policies 未正確設置

**解決:**
1. 確認 policies 已創建
2. 檢查 `auth.uid()` 是否與檔案路徑中的 userId 匹配
3. 確認用戶已登入且有有效的 session

---

### ❌ Error: "Bucket not found"

**原因:** `avatars` bucket 不存在

**解決:**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

---

### ❌ Error: "File size exceeds limit"

**原因:** 檔案超過 5MB

**解決:**
1. 壓縮圖片
2. 或增加 bucket 的 `file_size_limit`

---

### ❌ Error: "Invalid file type"

**原因:** 檔案類型不在允許列表中

**解決:**
確認檔案是 JPEG, PNG, GIF 或 WebP 格式

---

## 安全性說明

### ✅ 已實現的安全措施

1. **路徑驗證**: 用戶只能上傳到自己的資料夾 `{userId}/`
2. **檔案大小限制**: 最大 5MB
3. **檔案類型白名單**: 只允許圖片格式
4. **Public Read**: 頭像可公開訪問（適合顯示在個人檔案）
5. **Authenticated Write**: 只有登入用戶可以上傳/更新/刪除

### 🔒 路徑結構

```
avatars/
├── {user-id-1}/
│   └── avatar-{timestamp}.jpg
├── {user-id-2}/
│   └── avatar-{timestamp}.png
└── {user-id-3}/
    └── avatar-{timestamp}.webp
```

每個用戶只能訪問自己的資料夾。

---

## 完整 SQL 腳本（一次執行）

如果你想一次性設置所有內容，在 **SQL Editor** 執行：

```sql
-- 1. 創建 bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- 2. 創建 policies (需要在 Dashboard UI 中設置，或使用 supabase CLI)
```

**注意:** Storage policies 通常需要通過 Dashboard UI 或 Supabase CLI 設置，因為它們需要特殊權限。

---

## 使用 Supabase CLI（進階）

如果你有 Supabase CLI，可以使用：

```bash
# 創建 bucket
supabase storage create avatars --public

# 設置 policies
supabase storage policy create avatars "Public Access" \
  --operation SELECT \
  --expression "bucket_id = 'avatars'"

supabase storage policy create avatars "Users can upload avatar" \
  --operation INSERT \
  --role authenticated \
  --expression "bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text"
```

---

## 完成檢查清單

- [ ] Avatars bucket 已創建
- [ ] Bucket 設置為 public
- [ ] File size limit 設為 5MB
- [ ] Allowed MIME types 包含圖片格式
- [ ] Public Access policy 已創建 (SELECT)
- [ ] Upload policy 已創建 (INSERT)
- [ ] Update policy 已創建 (UPDATE)
- [ ] Delete policy 已創建 (DELETE)
- [ ] 測試上傳功能正常
- [ ] 頭像在側邊欄即時更新

完成後，用戶應該可以成功上傳頭像！
