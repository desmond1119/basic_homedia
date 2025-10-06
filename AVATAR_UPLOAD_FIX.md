# Avatar Upload Fix - 2025-10-06

## 問題分析

### 1. uploadUserAvatar 缺少錯誤處理
`profileSlice.ts` 中的 `uploadUserAvatar` thunk 缺少：
- 文件大小驗證
- 文件類型驗證  
- 錯誤處理和日誌記錄
- 適當的錯誤消息

### 2. EditProfileForm 沒有用戶反饋
`EditProfileForm` 組件沒有：
- 向用戶顯示錯誤消息
- 提供成功反饋
- 優雅地處理上傳失敗

## 修復內容

### 1. 增強 uploadUserAvatar Thunk
**文件**: `/src/features/profile/store/profileSlice.ts`

新增：
- ✅ 文件大小驗證（最大 5MB）
- ✅ 文件類型驗證（JPEG、PNG、GIF、WebP）
- ✅ 全面的錯誤處理
- ✅ 詳細的控制台日誌
- ✅ 帶有錯誤代碼的適當錯誤消息

```typescript
export const uploadUserAvatar = createAsyncThunk<string, { userId: string; file: File }>(
  'profile/uploadUserAvatar',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      // 驗證文件大小（最大 5MB）
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('AVATAR_TOO_LARGE');
      }

      // 驗證文件類型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('INVALID_FILE_TYPE');
      }

      // 上傳邏輯...
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### 2. 改進 EditProfileForm 組件  
**文件**: `/src/features/profile/components/EditProfileForm.tsx`

新增：
- ✅ 成功/錯誤的 Toast 通知
- ✅ 翻譯的錯誤消息
- ✅ 上傳期間的加載動畫
- ✅ 上傳後重置文件輸入
- ✅ 針對不同失敗類型的特定錯誤處理

```typescript
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user?.id) return;

  try {
    const result = await dispatch(uploadUserAvatar({ userId: user.id, file }));
    
    if (uploadUserAvatar.fulfilled.match(result)) {
      // 成功處理
      toast.success(t('profile.edit.avatarUploadSuccess'));
    } else if (uploadUserAvatar.rejected.match(result)) {
      // 錯誤處理
      const errorMessage = result.payload as string;
      // 顯示翻譯的錯誤消息
    }
  } catch (error) {
    // 異常處理
  }
};
```

### 3. Storage Bucket 配置
**文件**: `/supabase/migrations/006_fix_avatar_storage.sql`

創建遷移以確保：
- ✅ Avatars bucket 存在並具有正確設置
- ✅ 公共讀取訪問策略
- ✅ 經過身份驗證的上傳/更新/刪除策略
- ✅ 適當的 RLS（行級安全）規則

## 如何應用修復

### 1. 運行數據庫遷移
```bash
# 應用新遷移
supabase db push

# 或手動運行 SQL
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/006_fix_avatar_storage.sql
```

### 2. 重啟開發服務器
```bash
npm run dev
```

## 測試清單

- [ ] 用戶可以點擊相機圖標選擇頭像
- [ ] 文件大小驗證有效（拒絕 > 5MB 的文件）
- [ ] 文件類型驗證有效（拒絕非圖像文件）
- [ ] 上傳顯示加載動畫
- [ ] 成功上傳後顯示成功 toast
- [ ] 失敗時顯示帶翻譯消息的錯誤 toast
- [ ] 頭像在 UI 中立即更新
- [ ] 頁面刷新後頭像保持
- [ ] 公共 URL 可訪問

## 錯誤消息

處理以下錯誤代碼：

| 錯誤代碼 | 翻譯鍵 | 描述 |
|---------|--------|------|
| `AVATAR_TOO_LARGE` | `profile.edit.errors.avatarTooLarge` | 文件超過 5MB |
| `INVALID_FILE_TYPE` | `profile.edit.errors.invalidFileType` | 不支持的文件格式 |
| 通用上傳錯誤 | `profile.edit.avatarUploadError` | 其他上傳失敗 |

## 所需翻譯

確保所有語言文件中存在這些鍵（已存在於 en.json、zh-TW.json、zh-CN.json）：

```json
{
  "profile": {
    "edit": {
      "avatarUploadSuccess": "頭像上傳成功！",
      "avatarUploadError": "頭像上傳失敗",
      "errors": {
        "avatarTooLarge": "頭像圖片必須小於 5MB",
        "invalidFileType": "無效的檔案類型，僅支援 JPEG、PNG、GIF 和 WebP"
      }
    }
  },
  "common": {
    "uploading": "上傳中..."
  }
}
```

## 技術細節

### Storage 路徑結構
```
avatars/
  └── {user_id}/
      └── avatar-{timestamp}.{ext}
```

### 允許的文件類型
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/gif`
- `image/webp`

### 文件大小限制
- 最大：5MB (5,242,880 bytes)

### RLS 策略
1. **公共讀取**：任何人都可以查看頭像
2. **經過身份驗證的上傳**：用戶只能上傳到自己的文件夾
3. **經過身份驗證的更新**：用戶只能更新自己的頭像
4. **經過身份驗證的刪除**：用戶只能刪除自己的頭像

## 故障排除

### 問題："Upload failed: new row violates row-level security policy"
**解決方案**：運行遷移以更新 RLS 策略

### 問題："File too large" 錯誤
**解決方案**：確保文件小於 5MB

### 問題："Invalid file type" 錯誤  
**解決方案**：僅使用 JPEG、PNG、GIF 或 WebP 圖像

### 問題：頭像在 UI 中不更新
**解決方案**：檢查瀏覽器控制台錯誤，驗證 storage bucket 是公共的

## 關鍵修復點

1. **添加了完整的錯誤處理**：uploadUserAvatar 現在會捕獲並正確處理所有錯誤
2. **用戶友好的反饋**：使用 toast 通知顯示成功/失敗消息
3. **文件驗證**：在上傳前驗證文件大小和類型
4. **控制台日誌**：添加詳細日誌以便調試
5. **RLS 策略**：確保 storage bucket 有正確的權限設置thunk
- ✅ Toast 通知顯示成功/失敗訊息
- ✅ i18n 支援的錯誤訊息

### SidebarNav.tsx
- ✅ 即時顯示上傳的頭像
{{ ... }}
```
- ✅ 優雅的 fallback 到首字母圓圈

## 檔案限制

- **最大檔案大小**: 5MB
- **支援格式**: JPEG, JPG, PNG, GIF, WebP
- **儲存路徑**: `{userId}/avatar-{timestamp}.{ext}`
- **Public URL**: 自動生成，可直接訪問

## 安全性

- ✅ RLS 政策確保用戶只能上傳/更新/刪除自己的頭像
- ✅ 檔案類型白名單防止惡意檔案上傳
- ✅ 檔案大小限制防止濫用儲存空間
- ✅ 路徑驗證確保檔案儲存在正確的用戶資料夾

## Troubleshooting

### 錯誤: "Failed to upload avatar"
- 檢查 Supabase Storage bucket 是否已創建
- 檢查 RLS 政策是否正確設置
- 確認用戶已登入且有有效的 auth token

### 錯誤: "Avatar image must be less than 5MB"
- 壓縮圖片或選擇較小的檔案

### 錯誤: "Invalid file type"
- 只支援 JPEG, PNG, GIF, WebP 格式

### 頭像未即時更新
- 檢查 Realtime 訂閱是否正常運作
- 重新整理頁面
- 檢查 Console 是否有錯誤訊息

## 相關檔案

- `supabase/migrations/005_setup_storage_avatars.sql` - Storage 設置
- `src/features/profile/infrastructure/ProfileRepository.ts` - 上傳邏輯
- `src/features/profile/store/profileSlice.ts` - Redux 狀態管理
- `src/features/profile/components/EditProfileModal.tsx` - UI 組件
- `src/shared/components/SidebarNav.tsx` - 頭像顯示

## 完成 ✅

執行 migration 後，頭像上傳功能應該可以正常運作。
