# 論壇發文功能修復 - 2025-10-06

## 問題根源

用戶無法在 `/forum` 發布文章的主要原因：

### 1. ❌ 缺少 RLS (Row Level Security) 策略
**問題**: `posts` 表啟用了 RLS 但沒有定義任何策略，導致所有插入操作被拒絕。

**錯誤**: 
```
new row violates row-level security policy for table "posts"
```

### 2. ❌ 缺少 forum-media Storage Bucket
**問題**: 上傳媒體文件時找不到 `forum-media` bucket。

## 修復方案

### ✅ 修復 1: 添加 Forum RLS 策略
**文件**: `/supabase/migrations/007_enable_forum_rls.sql`

為以下表添加完整的 RLS 策略：
- ✅ **posts** - 發文表
- ✅ **comments** - 評論表
- ✅ **categories** - 分類表
- ✅ **likes** - 點讚表
- ✅ **bookmarks** - 收藏表
- ✅ **reposts** - 轉發表

#### Posts 表策略：
```sql
-- 所有人可以查看未刪除的文章
CREATE POLICY "Posts are viewable by everyone"
ON posts FOR SELECT TO public
USING (is_deleted = false);

-- 認證用戶可以插入自己的文章
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 用戶可以更新自己的文章
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- 用戶可以刪除自己的文章
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### ✅ 修復 2: 設置 Forum Media Storage
**文件**: `/supabase/migrations/008_setup_forum_media_storage.sql`

創建 `forum-media` bucket 並設置策略：
- ✅ 公共讀取訪問
- ✅ 認證用戶上傳到自己的文件夾
- ✅ 用戶只能管理自己的媒體文件
- ✅ 支持圖片和視頻（最大 10MB）

#### 支持的文件類型：
- 圖片: JPEG, JPG, PNG, GIF, WebP
- 視頻: MP4, MOV
- 最大大小: 10MB

### ✅ 修復 3: 代碼層面已完成
之前已經修復：
- ✅ `ForumRepository.ts` - 添加 Result 導入
- ✅ `PostFormModal.tsx` - 添加國際化支持
- ✅ 錯誤處理和驗證

## 應用修復步驟

### 1. 運行數據庫遷移

```bash
# 方法 1: 使用 Supabase CLI (推薦)
supabase db push

# 方法 2: 手動運行 SQL
# 在 Supabase Dashboard -> SQL Editor 中執行：
# - 007_enable_forum_rls.sql
# - 008_setup_forum_media_storage.sql
```

### 2. 驗證遷移

在 Supabase Dashboard 檢查：

**檢查 RLS 策略**:
```sql
-- 查看 posts 表的策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'posts';
```

**檢查 Storage Bucket**:
```sql
-- 查看 forum-media bucket
SELECT * FROM storage.buckets WHERE id = 'forum-media';
```

### 3. 重啟開發服務器

```bash
npm run dev
```

## 測試清單

### 基本發文功能
- [ ] 用戶可以打開發文彈窗
- [ ] 可以選擇分類
- [ ] 可以輸入標題和內容
- [ ] 可以添加標籤
- [ ] 可以上傳圖片/視頻
- [ ] 點擊"發布"按鈕成功創建文章
- [ ] 文章立即顯示在論壇列表中

### 權限測試
- [ ] 未登錄用戶無法發文
- [ ] 用戶只能編輯/刪除自己的文章
- [ ] 所有人可以查看已發布的文章
- [ ] 管理員可以管理所有分類

### 媒體上傳測試
- [ ] 可以上傳 JPEG/PNG 圖片
- [ ] 可以上傳 GIF 動圖
- [ ] 可以上傳 WebP 圖片
- [ ] 可以上傳 MP4 視頻
- [ ] 超過 10MB 的文件被拒絕
- [ ] 不支持的文件類型被拒絕

### 國際化測試
- [ ] 發文表單支持中文
- [ ] 發文表單支持英文
- [ ] 錯誤消息正確翻譯

## RLS 策略詳解

### Posts 表權限矩陣

| 操作 | 匿名用戶 | 認證用戶 | 文章作者 | 管理員 |
|------|---------|---------|---------|--------|
| SELECT (查看) | ✅ (未刪除) | ✅ (未刪除) | ✅ | ✅ |
| INSERT (創建) | ❌ | ✅ (自己) | ✅ | ✅ |
| UPDATE (更新) | ❌ | ❌ | ✅ | ✅ |
| DELETE (刪除) | ❌ | ❌ | ✅ | ✅ |

### Categories 表權限矩陣

| 操作 | 匿名用戶 | 認證用戶 | 管理員 |
|------|---------|---------|--------|
| SELECT (查看) | ✅ (活躍) | ✅ (活躍) | ✅ (全部) |
| INSERT (創建) | ❌ | ❌ | ✅ |
| UPDATE (更新) | ❌ | ❌ | ✅ |
| DELETE (刪除) | ❌ | ❌ | ✅ |

### Comments 表權限矩陣

| 操作 | 匿名用戶 | 認證用戶 | 評論作者 |
|------|---------|---------|---------|
| SELECT (查看) | ✅ (未刪除) | ✅ (未刪除) | ✅ |
| INSERT (創建) | ❌ | ✅ (自己) | ✅ |
| UPDATE (更新) | ❌ | ❌ | ✅ |
| DELETE (刪除) | ❌ | ❌ | ✅ |

## Storage 策略詳解

### forum-media Bucket

**路徑結構**:
```
forum-media/
  └── {user_id}/
      ├── {timestamp}-image1.jpg
      ├── {timestamp}-image2.png
      └── {timestamp}-video.mp4
```

**權限**:
- 📖 **讀取**: 所有人（公共）
- 📤 **上傳**: 認證用戶（僅自己的文件夾）
- ✏️ **更新**: 認證用戶（僅自己的文件）
- 🗑️ **刪除**: 認證用戶（僅自己的文件）

## 故障排除

### 問題 1: "new row violates row-level security policy"
**原因**: RLS 策略未正確設置
**解決**: 運行 `007_enable_forum_rls.sql` 遷移

### 問題 2: "Bucket not found: forum-media"
**原因**: Storage bucket 未創建
**解決**: 運行 `008_setup_forum_media_storage.sql` 遷移

### 問題 3: 上傳媒體失敗
**原因**: 
- 文件超過 10MB
- 文件類型不支持
- Storage 策略未設置

**解決**:
1. 檢查文件大小和類型
2. 確認 Storage 策略已創建
3. 查看瀏覽器控制台錯誤

### 問題 4: 文章創建成功但不顯示
**原因**: 可能是前端狀態管理問題
**解決**:
1. 檢查 Redux store 是否更新
2. 刷新頁面查看文章是否存在
3. 檢查 `posts_with_user` 視圖

### 問題 5: 管理員無法管理分類
**原因**: 用戶的 role 不是 'admin'
**解決**:
```sql
-- 將用戶設置為管理員
UPDATE app_users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## 技術細節

### 使用的 Supabase 功能

1. **Row Level Security (RLS)**
   - 表級安全策略
   - 基於 `auth.uid()` 的用戶識別
   - 細粒度的 CRUD 權限控制

2. **Storage Buckets**
   - 公共/私有 bucket 設置
   - 文件大小和類型限制
   - 基於路徑的訪問控制

3. **PostgreSQL Functions**
   - `auth.uid()` - 獲取當前用戶 ID
   - `storage.foldername()` - 解析文件路徑

### 數據流程

```
用戶發文
  ↓
前端驗證 (PostFormModal)
  ↓
上傳媒體 (如有) → Storage Bucket (forum-media)
  ↓
創建文章 → posts 表
  ↓
RLS 檢查: auth.uid() = user_id ✅
  ↓
返回完整文章數據 (posts_with_user 視圖)
  ↓
更新 Redux Store
  ↓
UI 顯示新文章
```

## 安全考慮

1. **防止未授權訪問**: RLS 確保用戶只能操作自己的內容
2. **防止 SQL 注入**: 使用 Supabase 客戶端的參數化查詢
3. **文件上傳安全**: 
   - 限制文件大小
   - 限制文件類型
   - 用戶隔離的存儲路徑
4. **軟刪除**: 使用 `is_deleted` 標記而非物理刪除

## 性能優化

1. **索引**: 已在關鍵列上創建索引
   - `posts(user_id)`
   - `posts(category_id)`
   - `posts(created_at DESC)`

2. **視圖**: 使用 `posts_with_user` 視圖預先 JOIN 用戶數據

3. **分頁**: 前端實現無限滾動加載

## 下一步

- [ ] 測試所有發文功能
- [ ] 測試媒體上傳
- [ ] 測試權限控制
- [ ] 驗證國際化
- [ ] 性能測試（大量文章）
