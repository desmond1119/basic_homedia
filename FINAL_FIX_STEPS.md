# 註冊問題最終修復方案

## 問題根源
經過深入分析，發現問題是：
1. **雙重插入衝突**：資料庫觸發器 `handle_app_user_upsert()` 在 `auth.users` INSERT 時自動插入 `app_users`
2. **應用層也插入**：`AuthRepository.register()` 在 signUp 後也手動插入 `app_users`
3. **權限與邏輯衝突**：兩者同時執行導致競爭條件、RLS 阻擋、或資料格式問題

## 解決方案
**禁用自動觸發器，完全由應用層控制註冊流程**

這個方案的優點：
- ✅ 避免觸發器與應用層邏輯衝突
- ✅ 更容易調試和追蹤錯誤
- ✅ 完全控制每個步驟的資料格式
- ✅ 符合 Domain-Driven Design 架構

## 執行步驟

### Step 1: 在 Supabase SQL Editor 執行修復腳本

1. **打開 Supabase SQL Editor**  
   https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql

2. **複製並執行以下 SQL**（`supabase/migrations/DISABLE_AUTO_TRIGGER.sql`）

```sql
-- 1. 禁用自動觸發器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. 設定 RLS 策略允許註冊
DROP POLICY IF EXISTS "Auth users can insert" ON public.app_users;
CREATE POLICY "Auth users can insert" ON public.app_users
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.app_users;
CREATE POLICY "Users can view own profile" ON public.app_users
FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.app_users;
CREATE POLICY "Users can update own profile" ON public.app_users
FOR UPDATE USING (auth.uid() = id);

-- 3. 允許公開查看 provider 資料
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.app_users;
CREATE POLICY "Anyone can view provider profiles" ON public.app_users
FOR SELECT USING (role = 'provider' AND is_active = true);

-- 4. Admin 可以查看所有用戶
DROP POLICY IF EXISTS "Admins can view all users" ON public.app_users;
CREATE POLICY "Admins can view all users" ON public.app_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.app_users au
    WHERE au.id = auth.uid() AND au.role = 'admin'
  )
);

-- 5. 確認設定
SELECT 'Trigger disabled - Registration now controlled by application layer' as status;
```

3. **點擊 "Run" 執行**
4. **確認成功訊息**：應該看到 "Trigger disabled..." 的訊息

### Step 2: 測試註冊流程

在專案目錄執行：

```bash
node scripts/testRegister.mjs
```

**期望結果**：
```
=== 開始註冊測試 ===
Email: test1759695xxx@example.com
Username: testuser17596xxx

[Step 1] 檢查 username 可用性...
✅ Username available

[Step 2] 執行 auth.signUp...
✅ Auth user created. ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Session: ✅ Created

[Step 3] 插入到 app_users...
✅ User profile created in app_users

[Step 4] 查詢 user_profiles...
✅ User profile fetched successfully
   Username: testuser17596xxx
   Email: test1759695xxx@example.com
   Role: homeowner

[Cleanup] 登出...
✅ 測試完成！
```

### Step 3: 網站測試

1. 打開 http://localhost:3001
2. 點擊註冊
3. 填寫表單（確保 username 符合格式要求）
4. 提交

**期望結果**：
- ✅ 不再出現 `auth.register.error`
- ✅ 成功跳轉到 dashboard 或顯示確認訊息

## 如果仍然失敗

### 診斷步驟

1. **檢查 SQL 是否成功執行**
   ```sql
   -- 確認觸發器已被移除
   SELECT * FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   
   -- 應該返回空結果
   ```

2. **檢查 RLS 策略**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public' AND tablename = 'app_users'
   ORDER BY policyname;
   ```

3. **查看 Supabase Auth Logs**
   - 進入 Supabase Dashboard → Auth → Logs
   - 查找最新的 signup 事件
   - 檢查詳細錯誤訊息

4. **查看瀏覽器 Console**
   - 打開開發者工具 (F12)
   - 切換到 Console 標籤
   - 重新嘗試註冊
   - 查看詳細錯誤堆疊

## 技術說明

### 註冊流程（應用層控制）

```
1. 前端提交註冊表單
   ↓
2. AuthRepository.register()
   ├─ 檢查 username 是否可用 (RPC: is_username_available)
   ├─ Supabase Auth signUp (創建 auth.users 記錄)
   ├─ 手動插入 app_users (完整資料控制)
   ├─ 查詢 user_profiles 視圖
   └─ 返回 AuthSession
   ↓
3. Redux 更新狀態
   ↓
4. 導航到 Dashboard
```

### RLS 策略說明

- **INSERT**: 只允許用戶插入自己的記錄 (`auth.uid() = id`)
- **SELECT**: 用戶可以查看自己的資料，或公開的 provider 資料
- **UPDATE**: 用戶只能更新自己的資料
- **DELETE**: 未設定（可根據需求添加）

### 為什麼這個方案更好

1. **明確的控制流**：每一步都在應用層可見和可控
2. **容易調試**：可以在每一步添加日誌和錯誤處理
3. **資料驗證**：在插入前可以完整驗證所有欄位
4. **避免競爭條件**：不會有觸發器與應用層同時操作
5. **符合架構**：遵循 Clean Architecture / DDD 原則

## 後續建議

### 如果要恢復觸發器（不建議）

如果未來需要恢復觸發器，必須：
1. 移除 `AuthRepository` 中的手動插入邏輯
2. 確保觸發器以 `SECURITY DEFINER` 執行
3. 完整測試所有邊緣情況（username 格式、重複、RLS 等）

### 生產環境部署

在部署到生產環境前：
1. ✅ 執行 `DISABLE_AUTO_TRIGGER.sql`
2. ✅ 測試註冊流程（正常情況）
3. ✅ 測試邊緣情況（重複 username、重複 email、無效格式）
4. ✅ 測試 provider 註冊（需要 provider_type_id）
5. ✅ 測試郵件確認流程（如果啟用）

## 支援

如果執行後仍有問題：
1. 提供完整的錯誤訊息（包括 SQL Editor、測試腳本、瀏覽器 Console）
2. 提供 Supabase Auth Logs 的截圖
3. 說明在哪一步失敗

---

**重要**：執行 SQL 修復後，記得重新測試。這個方案已經過仔細設計，應該能解決註冊問題。
