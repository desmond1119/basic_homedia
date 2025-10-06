# 修復論壇發文功能指南

## 問題描述
用戶無法在 `/forum` 發佈文章，因為數據庫表結構與代碼期望不匹配。

## 根本原因
- 代碼期望的表名: `posts`, `comments`, `likes`, `bookmarks`, `reposts`
- 數據庫現有表名: `forum_posts`, `forum_comments`, `forum_likes` 等
- 缺少必要的視圖: `posts_with_user`, `comments_with_user`
- 缺少必要的函數和觸發器
- `categories` 表缺少 `slug` 和 `display_order` 欄位

## 修復步驟

### 1. 登入 Supabase Dashboard
前往你的 Supabase 項目控制台

### 2. 執行 SQL 腳本
1. 點擊左側菜單的 **SQL Editor**
2. 點擊 **New query**
3. 打開文件: `supabase/FORUM_TABLES_FIX.sql`
4. 複製所有內容並貼到 SQL Editor
5. 點擊 **Run** 按鈕執行

### 3. 確認執行成功
執行後應該看到成功消息:
```
✅ Forum tables created successfully!
📊 Created tables: posts, comments, likes, bookmarks, reposts
👁️ Created views: posts_with_user, comments_with_user
🔧 Created functions and triggers
🔒 Created RLS policies
📦 Storage: forum-media bucket configured
🔄 Updated categories table with slug and display_order
```

### 4. 驗證表結構
在 SQL Editor 中執行以下查詢來驗證:

```sql
-- 檢查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comments', 'likes', 'bookmarks', 'reposts');

-- 檢查視圖是否存在
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('posts_with_user', 'comments_with_user');

-- 檢查 categories 表
SELECT * FROM categories LIMIT 5;
```

### 5. 創建測試分類 (如果 categories 為空)
如果 categories 表為空，執行以下 SQL 創建測試分類:

```sql
INSERT INTO categories (name, slug, description, icon, display_order, is_active)
VALUES
  ('一般討論', 'general', '一般討論主題', '💬', 1, true),
  ('裝修分享', 'renovation', '裝修經驗分享', '🏠', 2, true),
  ('設計靈感', 'design', '設計靈感與想法', '✨', 3, true),
  ('問題求助', 'help', '裝修相關問題', '❓', 4, true);
```

### 6. 測試發文功能
1. 清除瀏覽器緩存 (Cmd+Shift+Delete)
2. 重新整理應用 (Cmd+Shift+R)
3. 登入應用
4. 前往 `/forum` 頁面
5. 點擊 "創建文章" 或 "Create Post" 按鈕
6. 填寫表單並提交

### 7. 故障排除

#### 問題: 仍然無法發文
**檢查認證狀態**:
```sql
-- 檢查當前用戶是否存在於 app_users
SELECT * FROM app_users WHERE id = auth.uid();
```

**檢查 RLS 策略**:
```sql
-- 查看 posts 表的策略
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

#### 問題: "permission denied" 錯誤
確保 RLS 策略正確設置。重新執行 `FORUM_TABLES_FIX.sql` 腳本。

#### 問題: "relation does not exist" 錯誤
確保 `app_users` 和 `categories` 表存在:
```sql
-- 創建基礎表 (如果不存在)
-- 請參考 COMPLETE_SCHEMA_FIX.sql 或 ADMIN_COMPLETE_SCHEMA.sql
```

#### 問題: 上傳圖片失敗
檢查 storage bucket:
```sql
-- 檢查 forum-media bucket
SELECT * FROM storage.buckets WHERE id = 'forum-media';

-- 如果不存在，手動創建
INSERT INTO storage.buckets (id, name, public)
VALUES ('forum-media', 'forum-media', true);
```

## 數據庫表結構說明

### posts 表
- `id`: UUID 主鍵
- `user_id`: 發文用戶 ID
- `category_id`: 分類 ID
- `title`: 標題
- `content`: 內容
- `tags`: 標籤數組
- `media_urls`: 媒體 URL 數組
- `like_count`, `comment_count`, `repost_count`, `bookmark_count`: 統計計數
- `is_deleted`: 軟刪除標記

### comments 表
- `id`: UUID 主鍵
- `post_id`: 所屬文章 ID
- `user_id`: 評論用戶 ID
- `parent_id`: 父評論 ID (用於嵌套回覆)
- `content`: 評論內容
- `like_count`: 點讚數

### 其他表
- `likes`: 點讚記錄
- `bookmarks`: 收藏記錄
- `reposts`: 轉發記錄

## 自動功能

腳本包含以下自動功能:
- ✅ 自動更新計數器 (點讚數、評論數等)
- ✅ 自動更新 `updated_at` 時間戳
- ✅ 軟刪除支持
- ✅ RLS 安全策略
- ✅ 存儲桶權限配置

## 完成後確認

執行以下測試確保一切正常:

1. ✅ 可以查看論壇頁面
2. ✅ 可以打開創建文章表單
3. ✅ 可以選擇分類
4. ✅ 可以輸入標題和內容
5. ✅ 可以上傳圖片 (可選)
6. ✅ 可以成功發佈文章
7. ✅ 文章顯示在論壇列表中
8. ✅ 可以查看文章詳情
9. ✅ 可以發表評論
10. ✅ 可以點讚、收藏

## 需要幫助?

如果遇到問題:
1. 檢查瀏覽器控制台錯誤 (F12 > Console)
2. 檢查網絡請求 (F12 > Network)
3. 檢查 Supabase 日誌 (Dashboard > Logs)
4. 重新執行 SQL 腳本

---

**最後更新**: 2025-10-06
**狀態**: 準備執行
