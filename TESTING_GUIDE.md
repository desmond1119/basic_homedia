# Portfolio Feature 測試指南

## ✅ 已完成配置

- ✅ Portfolio reducer 已註冊到 Redux store
- ✅ ProviderProfilePage 已整合 Portfolio section
- ✅ Dev server 正在運行

---

## 🧪 測試步驟

### Step 1: 測試資料庫 (必須先執行)

1. 開啟 Supabase Dashboard SQL Editor:
   ```
   https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql
   ```

2. 執行 Migration（如果尚未執行）:
   - 複製 `supabase/manual_apply_new_migrations.sql` 全部內容
   - 貼上到 SQL Editor
   - 點擊 "Run"
   - 應該看到 "Success" 訊息

3. 執行測試查詢:
   - 複製 `test_portfolio_db.sql` 內容
   - 貼上到 SQL Editor
   - 點擊 "Run"
   - 檢查結果:
     - ✅ portfolio_categories 應該有 6 筆預設分類
     - ✅ portfolios 表已建立（可能為空）
     - ✅ RLS policies 已設定
     - ✅ Triggers 已建立

---

### Step 2: 測試前端頁面

#### 測試 A: 列表頁（無需登入）
```
http://localhost:5173/portfolios
```
**預期結果**: 
- ✅ 顯示空列表頁
- ✅ 有 "Newest" 和 "Most Popular" 排序按鈕
- ✅ 顯示 "No portfolios yet"

#### 測試 B: Provider Profile 頁
```
http://localhost:5173/provider/{providerId}
```
**預期結果**: 
- ✅ 正常顯示 provider 資料
- ✅ **如果該 provider 有 approved portfolios，會顯示 "作品集" section**
- ✅ 顯示最多 6 個 portfolio 卡片
- ✅ 有 "查看全部 →" 按鈕

#### 測試 C: 上傳功能（需要 provider 登入）
```
http://localhost:5173/portfolio/upload
```

**登入步驟**:
1. 確保你有 provider 帳號
2. 登入系統
3. 訪問上傳頁面

**測試流程**:
1. **Step 1 - 專案詳情**:
   - ✅ 填寫 "專案標題"（必填）
   - ✅ 填寫地址
   - ✅ 填寫面積 (sq ft)
   - ✅ 選擇貨幣（HKD/USD/CNY）
   - ✅ 填寫總費用
   - ✅ 填寫描述
   - ✅ 點擊 "下一步"

2. **Step 2 - 上傳圖片**:
   - ✅ 拖放或點擊上傳圖片（最多 30 張，每張 5MB）
   - ✅ 圖片顯示預覽
   - ✅ 點擊圖片選擇封面（會顯示 "封面" 標籤）
   - ✅ 可以點擊 X 刪除圖片
   - ✅ 點擊 "上傳"

3. **Step 3 - 完成**:
   - ✅ 顯示成功訊息
   - ✅ 顯示 "您的作品集正在等待管理員審核"
   - ✅ 點擊 "查看我的作品集" 跳轉

---

### Step 3: 測試互動功能

#### 測試 D: 收藏功能（需要登入）
1. 以任意用戶登入
2. 訪問 portfolios 列表頁
3. 點擊卡片右上角的 ❤️ 按鈕
   - ✅ 圖示變為實心紅色
   - ✅ 收藏數 +1

#### 測試 E: Analytics（需要 provider 登入）
1. 建立測試組件或訪問包含 `<AnalyticsTab />` 的頁面
2. 檢查顯示:
   - ✅ 總瀏覽量
   - ✅ 總收藏數
   - ✅ 互動率百分比
   - ✅ 30 天瀏覽量柱狀圖
   - ✅ 30 天收藏數柱狀圖

---

### Step 4: 測試 Admin 審核（需要 admin 登入）

#### 在 Supabase Dashboard 手動審核:
```sql
-- 查看待審核的 portfolios
SELECT id, title, status, user_id, created_at 
FROM portfolios 
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 批准一個 portfolio
UPDATE portfolios 
SET status = 'approved' 
WHERE id = 'your-portfolio-id';

-- 拒絕一個 portfolio
UPDATE portfolios 
SET status = 'rejected' 
WHERE id = 'your-portfolio-id';
```

---

## 🔍 驗證檢查清單

### 資料庫層 ✅
- [ ] 5 個表格已建立（portfolios, portfolio_images, portfolio_categories, portfolio_collects, portfolio_impressions）
- [ ] portfolio_feed view 已建立
- [ ] RLS policies 正確設定
- [ ] Triggers 正常運作
- [ ] 預設分類已插入

### 功能層 ✅
- [ ] 列表頁正常顯示
- [ ] 上傳流程完整可用
- [ ] 收藏功能正常
- [ ] 排序切換正常
- [ ] 無限捲動正常

### UI/UX ✅
- [ ] Mobbin 黑白灰主題一致
- [ ] Hover 動畫流暢
- [ ] Framer Motion 過場自然
- [ ] 響應式布局正確
- [ ] i18n 翻譯完整

---

## 🐛 常見問題排查

### 問題 1: TypeScript 錯誤
```
portfolios table does not exist
```
**解決**: 
```bash
supabase gen types typescript --project-id jufwllhkgtvovyazgxld > src/core/infrastructure/supabase/database.types.ts
```

### 問題 2: 列表頁空白
**檢查**: 
- 資料庫是否有 approved 狀態的 portfolios
- Redux DevTools 確認 state.portfolio.portfolios 是否有資料

### 問題 3: 上傳失敗
**檢查**: 
- Supabase Storage bucket `provider-assets` 是否存在
- 檔案大小是否 < 5MB
- 用戶是否已登入且為 provider 角色

### 問題 4: 收藏按鈕無反應
**檢查**: 
- 用戶是否已登入
- RLS policies 是否正確設定
- 檢查 browser console 是否有錯誤

---

## 📊 測試數據建議

建議建立以下測試資料:
- 3-5 個 portfolios（不同 status）
- 每個 portfolio 3-8 張圖片
- 2-3 個用戶進行收藏
- 模擬一些瀏覽紀錄

---

## ✅ 全部測試完成後

確認以下都正常:
1. ✅ 資料庫 migration 成功
2. ✅ 列表頁顯示正確
3. ✅ 上傳功能完整
4. ✅ 收藏功能正常
5. ✅ Analytics 圖表顯示
6. ✅ Provider Profile 顯示 portfolios section
7. ✅ 無 TypeScript 錯誤
8. ✅ 無 Console 錯誤

**Portfolio Feature 測試完成！** 🎉
