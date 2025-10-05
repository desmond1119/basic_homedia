# 數據庫修復指南

## 問題診斷
錯誤訊息：**"Failed to create user: Database error creating new user"**

### 原因
數據庫遷移文件沒有完全應用到 Supabase，導致：
1. `app_users` 表缺少必要欄位（company_name, logo_url, bio 等）
2. `user_profiles` 視圖引用了不存在的欄位
3. RLS 策略可能阻止了註冊流程

## 快速修復步驟

### 方法 1：使用 Supabase Dashboard（推薦）

1. **打開 Supabase SQL Editor**
   - 訪問：https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql

2. **執行修復腳本**
   - 打開文件：`supabase/migrations/FIX_DATABASE_SCHEMA.sql`
   - 複製整個內容
   - 粘貼到 SQL Editor
   - 點擊 "Run" 執行

3. **驗證結果**
   - 查看執行結果，應該顯示 "Database schema fix complete!"
   - 確認沒有錯誤訊息

### 方法 2：使用 Supabase CLI（如果已安裝）

```bash
# 確保 Supabase CLI 已登錄
supabase login

# 應用遷移
supabase db push

# 或者直接執行修復腳本
supabase db execute -f supabase/migrations/FIX_DATABASE_SCHEMA.sql
```

## 修復內容

這個腳本會：

✅ 添加缺少的欄位到 `app_users` 表：
   - company_name, logo_url, bio
   - price_range, social_links
   - completed_projects, experience_years, team_size
   - founded_year, overall_rating, total_reviews
   - is_approved

✅ 重建 `user_profiles` 視圖（包含所有必要欄位）

✅ 修復 RLS 策略：
   - 允許新用戶註冊
   - 允許用戶查看自己的資料
   - 允許公開查看供應商資料
   - 允許管理員查看所有用戶

✅ 創建必要的輔助函數：
   - is_username_available()
   - is_admin()

✅ 創建必要的表（如果不存在）：
   - follows（關注）
   - bookmarks（收藏）

## 驗證修復

執行後，在 Supabase SQL Editor 中運行：

```sql
-- 檢查 app_users 結構
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_users' 
ORDER BY ordinal_position;

-- 檢查 user_profiles 視圖
SELECT * FROM user_profiles LIMIT 1;

-- 測試用戶名可用性檢查
SELECT is_username_available('testuser123');
```

## 測試註冊

修復後，嘗試在網站上註冊新用戶：
1. 打開 http://localhost:3001
2. 點擊註冊
3. 填寫表單並提交
4. 應該能成功創建用戶

## 常見問題

### Q: 執行腳本時出現權限錯誤
A: 確保你使用的是項目 owner 帳號登錄 Supabase Dashboard

### Q: 某些表已存在錯誤
A: 這是正常的，腳本使用了 `IF NOT EXISTS`，會跳過已存在的對象

### Q: 修復後仍然無法註冊
A: 
1. 清除瀏覽器緩存
2. 檢查瀏覽器控制台的詳細錯誤訊息
3. 檢查 Supabase Dashboard > Logs 中的錯誤日誌

## 預防措施

為了避免將來出現類似問題：

1. **使用 Supabase CLI** 管理遷移
   ```bash
   npm install -g supabase
   supabase init
   supabase link --project-ref jufwllhkgtvovyazgxld
   ```

2. **版本控制遷移文件**
   - 保持 `supabase/migrations/` 中的文件有序
   - 使用時間戳命名（例如：20251006_xxx.sql）

3. **測試環境**
   - 使用 `supabase start` 創建本地開發數據庫
   - 先在本地測試遷移，再應用到生產環境

## 需要幫助？

如果問題仍然存在：
1. 檢查 Supabase Dashboard > Logs
2. 查看瀏覽器開發者工具 Console
3. 提供完整的錯誤訊息以便診斷
