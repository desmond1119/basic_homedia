# 快速設置指南

## 🚀 頭像上傳功能設置（5 分鐘）

### 步驟 1: 創建 Bucket（1 分鐘）

在 **Supabase Dashboard** → **SQL Editor** 執行：

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;
```

### 步驟 2: 設置 Policies（3 分鐘）

前往 **Storage** → **Policies** → **New Policy**

#### Policy 1: Public Read
```
Name: Public Access
Operation: SELECT
Expression: bucket_id = 'avatars'
```

#### Policy 2: Upload
```
Name: Users can upload avatar
Operation: INSERT
Role: authenticated
Expression: bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 3: Update
```
Name: Users can update avatar
Operation: UPDATE
Role: authenticated
Expression: bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

#### Policy 4: Delete
```
Name: Users can delete avatar
Operation: DELETE
Role: authenticated
Expression: bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
```

### 步驟 3: 測試（1 分鐘）

1. 登入應用
2. 前往個人檔案編輯
3. 上傳頭像
4. 檢查側邊欄是否即時更新

---

## 🔧 管理員設置

### 設置管理員角色

```sql
UPDATE app_users SET role = 'admin' WHERE email = 'n46angle@gmail.com';
```

### 驗證

登入後應自動導航到 `/admin`，左側欄顯示「管理員儀表板」。

---

## 📋 完整檢查清單

### Storage
- [ ] Avatars bucket 已創建
- [ ] Public access 已啟用
- [ ] 4 個 policies 已設置
- [ ] 測試上傳成功

### Admin
- [ ] 管理員角色已設置
- [ ] 登入後導航到 /admin
- [ ] 側邊欄顯示管理員連結

### Profile
- [ ] 頭像上傳功能正常
- [ ] 側邊欄即時更新
- [ ] 個人資料同步

---

## 🆘 常見問題

### "must be owner of table objects"
→ 使用 Dashboard UI 設置 policies，不要用 SQL

### "Bucket not found"
→ 執行步驟 1 的 SQL

### "Policy violation"
→ 檢查 policies 是否正確設置

### 頭像未更新
→ 檢查 Console 錯誤訊息，確認 Realtime 訂閱正常

---

## 📚 詳細文檔

- `STORAGE_SETUP_GUIDE.md` - Storage 完整設置指南
- `AVATAR_UPLOAD_FIX.md` - 頭像上傳修復說明
- `ADMIN_LOGIN_FIX.md` - 管理員登入修復說明
