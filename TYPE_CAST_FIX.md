# ✅ 類型轉換問題已修復

## 問題
SQL 執行時出現錯誤：
```
ERROR: 42804: column "role" is of type user_role but expression is of type text
```

## 原因
`app_users` 表的 `role` 欄位是 ENUM 類型 (`user_role`)，但 SQL 查詢嘗試插入 TEXT 類型的值。

## 解決方案
在所有 SQL 腳本中，將 `role` 值強制轉型為 `user_role`：

### 修復前：
```sql
COALESCE(NEW.raw_user_meta_data->>'role', 'homeowner')
```

### 修復後：
```sql
COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'homeowner'::user_role)
```

## 已修復的檔案

### SQL 腳本：
1. ✅ `/supabase/diagnose_and_fix.sql`
   - INSERT INTO 的 VALUES
   - ON CONFLICT UPDATE 的 SET

2. ✅ `/supabase/fix_existing_user.sql`
   - SELECT 子查詢中的 role 轉換

3. ✅ `/supabase/quick_fix_login.sql`
   - 觸發器函數中的 role 處理

4. ✅ `/supabase/migrations/20251006_fix_app_users_recursion.sql`
   - 主要遷移檔案的 role 轉換

### TypeScript 檔案：
5. ✅ `/src/features/auth/infrastructure/AuthRepository.ts`
   - 添加類型斷言 `as 'admin' | 'provider' | 'homeowner'`

## 現在可以執行

### 步驟 1：修復現有用戶
在 Supabase SQL Editor 執行：
```sql
-- 執行 fix_existing_user.sql 的內容
```

### 步驟 2：完整設置
在 Supabase SQL Editor 執行：
```sql
-- 執行 diagnose_and_fix.sql 的內容
```

### 步驟 3：測試登入
1. 清除瀏覽器快取和 Local Storage
2. 重新載入頁面
3. 嘗試登入

## 預期結果

執行 SQL 後應該看到：
- ✅ "Before Fix" 顯示有 missing_app_users
- ✅ "After Fix" 顯示 missing_app_users = 0
- ✅ 所有用戶的 status = "OK"
- ✅ 觸發器和政策已正確創建

## 驗證查詢

```sql
-- 檢查所有用戶狀態
SELECT 
  au.email,
  apu.username,
  apu.role,
  CASE WHEN apu.id IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM auth.users au
LEFT JOIN app_users apu ON au.id = apu.id;
```

所有用戶都應該顯示 ✅。

## 如果還有問題

1. 檢查 `user_role` ENUM 定義：
```sql
SELECT unnest(enum_range(NULL::user_role));
```

應該顯示：
- admin
- provider
- homeowner

2. 如果 ENUM 缺少值，創建：
```sql
-- 僅在需要時執行
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'provider';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'homeowner';
```

## 類型轉換語法說明

PostgreSQL 需要明確的類型轉換：

| 情況 | 語法 | 說明 |
|------|------|------|
| JSON 轉 TEXT | `metadata->>'key'` | 雙箭頭返回 TEXT |
| TEXT 轉 ENUM | `'value'::user_role` | 使用 `::` 轉換 |
| JSON 轉 ENUM | `(metadata->>'key')::user_role` | 需要括號 |
| 帶預設值 | `COALESCE(val::type, 'default'::type)` | 兩邊都要轉型 |

## 完成！

所有類型錯誤已修復。現在執行修復腳本應該可以成功！
