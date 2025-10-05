# Portfolio Feature 快速設置指南

## Step 1: 執行 Database Migration (1 分鐘)

1. 開啟 Supabase Dashboard SQL Editor:
   👉 https://supabase.com/dashboard/project/jufwllhkgtvovyazgxld/sql

2. 點擊 "New Query"

3. 複製整個檔案內容並貼上：
   📁 `supabase/manual_apply_new_migrations.sql`

4. 點擊 "Run" 執行

5. 確認成功訊息 (應該會看到 tables created)

---

## Step 2: 註冊 Portfolio Reducer (30 秒)

開啟 `src/core/store/index.ts`，添加 portfolio reducer:

```typescript
import { portfolioReducer } from '@/features/portfolio/store/portfolioSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    forum: forumReducer,
    provider: providerReducer,
    portfolio: portfolioReducer,  // ← 添加這行
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});
```

---

## Step 3: 測試功能 (2 分鐘)

### 測試 A: 資料庫
在 Supabase SQL Editor 執行：
```sql
SELECT * FROM portfolio_categories;
SELECT * FROM portfolios LIMIT 5;
```

### 測試 B: 訪問列表頁
1. 啟動 dev server: `npm run dev`
2. 在瀏覽器訪問: http://localhost:5173/portfolios
3. 應該看到空列表頁 (因為尚無 portfolio)

### 測試 C: 上傳功能 (需要登入)
1. 以 provider 身份登入
2. 訪問: http://localhost:5173/portfolio/upload
3. 填寫表單並上傳圖片測試

---

## 🔧 可選: 整合到 ProviderProfilePage

在 `src/features/provider/components/ProviderProfilePage.tsx` bio 下方添加：

```tsx
import { useEffect } from 'react';
import { fetchPortfolios } from '@/features/portfolio/store/portfolioSlice';
import { PortfolioCard } from '@/features/portfolio/components/PortfolioCard';

// 在組件內
const { portfolios } = useAppSelector((state) => state.portfolio);

useEffect(() => {
  if (currentProfile) {
    void dispatch(fetchPortfolios({ 
      filters: { userId: currentProfile.id, status: 'approved' }, 
      limit: 6 
    }));
  }
}, [currentProfile, dispatch]);

// 在 render 中 bio 下方添加
{portfolios.length > 0 && (
  <div className="mt-12">
    <h2 className="text-3xl font-bold text-white mb-6">{t('provider.portfolio.sectionTitle')}</h2>
    <div className="grid grid-cols-3 gap-6">
      {portfolios.map(p => (
        <PortfolioCard key={p.id} portfolio={p} onClick={() => navigate(`/portfolio/${p.id}`)} />
      ))}
    </div>
  </div>
)}
```

---

## ✅ 完成！

功能已準備就緒：
- ✅ Provider 可上傳作品集
- ✅ 用戶可瀏覽/收藏
- ✅ Analytics 追蹤
- ✅ Admin 審核機制
