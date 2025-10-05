# User Profile Feature - Complete Implementation

## ✅ 已完成項目

### 1. Database Schema (SQL Migration)
**檔案**: `supabase/migrations/20251006_user_profile_feature.sql`

- ✅ ALTER `bookmarks` table - 添加 `bookmark_type` enum ('post', 'image', 'company')
- ✅ CREATE `user_stats` VIEW - 聚合用戶統計（followers/following/collected images/forum responses）
- ✅ CREATE `user_collected_images` VIEW - 用戶收藏的圖片集合
- ✅ CREATE `user_followed_companies` VIEW - 用戶關注的公司列表
- ✅ CREATE `calculate_user_badges()` FUNCTION - 計算用戶徽章（Top Collector 🏆 >100, Active Contributor 💬 >50, Influencer ⭐ >100 followers）
- ✅ RLS Policies - 用戶只能讀取自己的收藏
- ✅ Indexes - user_id, bookmark_type 優化查詢

### 2. Domain Layer
**檔案**: `src/features/profile/domain/Profile.types.ts`

```typescript
- UserStats (userId, badges, counts)
- UserBadge (id, label, icon)
- CollectedImage (bookmarkId, portfolioId, title, coverImageUrl, provider info)
- FollowedCompany (followId, companyId, companyName, portfoliosCount, avgRating)
- CollectionTab ('images' | 'companies')
```

### 3. Infrastructure Layer

#### Mapper
**檔案**: `src/features/profile/infrastructure/ProfileStatsMapper.ts`
- ✅ `toUserStats()` - 映射用戶統計數據 + badges
- ✅ `parseBadges()` - 解析 JSON badges
- ✅ `toCollectedImage()` - 映射收藏圖片
- ✅ `toFollowedCompany()` - 映射關注公司

#### Repository
**檔案**: `src/features/profile/infrastructure/ProfileStatsRepository.ts`
- ✅ `fetchUserStats(userId)` - 獲取用戶統計 + badges
- ✅ `fetchCollectedImages(userId, limit, offset)` - 分頁獲取收藏圖片
- ✅ `fetchFollowedCompanies(userId, limit, offset)` - 分頁獲取關注公司
- ✅ `subscribeToStats(userId, callback)` - **Realtime** 訂閱統計變化（監聽 follows/bookmarks/comments 表變化）

### 4. Redux State Management
**檔案**: `src/features/profile/store/profileStatsSlice.ts`

#### State
```typescript
{
  stats: UserStats | null,
  collectedImages: CollectedImage[],
  followedCompanies: FollowedCompany[],
  activeTab: 'images' | 'companies',
  hasMoreImages: boolean,
  hasMoreCompanies: boolean,
  isEditModalOpen: boolean,
  editData: UpdateProfileData,
  fetchStats/fetchCollections/updateProfile: AsyncState
}
```

#### Thunks
- ✅ `fetchUserStats` - 獲取統計
- ✅ `fetchCollectedImages` - 獲取收藏圖片（infinite scroll）
- ✅ `fetchFollowedCompanies` - 獲取關注公司（infinite scroll）

#### Actions
- ✅ `setActiveTab` - 切換 tab
- ✅ `openEditModal` / `closeEditModal`
- ✅ `setEditData`
- ✅ `updateStatsRealtime` - Realtime 更新

### 5. UI Components (Mobbin-inspired)

#### ProfileStatsPage
**檔案**: `src/features/profile/components/ProfileStatsPage.tsx`

**功能**:
- ✅ 大頭貼 (avatar) + hover scale 效果
- ✅ Username + Full Name + Bio
- ✅ Badges 顯示（漸變背景 + 圖示 + hover 放大）
- ✅ 4個統計按鈕 (Followers/Following/Collected/Responses)
  - Hover scale + glow 效果
  - 點擊導航到對應頁面
- ✅ Edit 按鈕（僅 own profile 顯示）
- ✅ Realtime 統計更新（Supabase subscription）
- ✅ Loading spinner

#### CollectionsPage
**檔案**: `src/features/profile/components/CollectionsPage.tsx`

**功能**:
- ✅ Tabs 切換（Images / Companies）
  - Active tab 下方白線動畫（layoutId）
  - AnimatePresence 淡入淡出切換
- ✅ **Images Grid**（2x2 md:3x3 lg:4x4）
  - Aspect square cards
  - Hover scale + 漸變遮罩
  - 顯示 title + provider name
  - 點擊跳轉 portfolio 詳情
- ✅ **Companies Cards**（grid cards）
  - Logo + Company Name + Rating ⭐
  - Bio + Portfolios count
  - Hover 提升 + shadow
  - 點擊跳轉 provider 頁面
- ✅ **Infinite Scroll**（IntersectionObserver）
  - 自動加載更多
  - Loading spinner
  - End message
- ✅ Empty states（無收藏圖片/公司）

#### EditProfileModal
**檔案**: `src/features/profile/components/EditProfileModal.tsx`

**功能**:
- ✅ Modal 淡入淡出動畫（Framer Motion spring）
- ✅ **Avatar Upload**
  - 圓形預覽
  - 點擊上傳
  - FileReader 即時預覽
  - 5MB size limit
- ✅ **Inline Form**
  - Username (unique, 3+ chars, alphanumeric + underscore)
  - Full Name
  - Bio (500 chars max, 字數統計)
  - Location
- ✅ **Validation**
  - Username 格式/長度檢查
  - Bio 長度檢查
  - 錯誤訊息顯示（紅色）
- ✅ **Actions**
  - Save Changes (loading state)
  - Cancel (關閉 modal)
- ✅ Backdrop blur + 點擊關閉

### 6. i18n Translations
**檔案**: `src/locales/en.json`, `src/locales/zh-TW.json`

```json
profile.stats.* (followers, following, collected, responses)
profile.collections.* (title, images, companies, noImages, noCompanies)
profile.edit.* (button, title, avatar, username, bio, location, save, cancel, saving)
profile.edit.errors.* (usernameTooShort, usernameInvalid, bioTooLong, avatarTooLarge)
```

### 7. Redux Store Integration
**檔案**: `src/core/store/store.ts`
- ✅ `profileStats: profileStatsReducer` 已註冊

---

## 🎨 UI/UX 特色

### Mobbin-inspired Design
- **黑白灰主題**: bg-black, bg-gray-900, text-white
- **卡片布局**: rounded-3xl/2xl + border-gray-800
- **Hover 效果**: scale 1.05 + box-shadow glow
- **動畫**: Framer Motion spring + AnimatePresence
- **按鈕**: bg-white text-black (主要) / bg-gray-800 (次要)

### Instagram-like Features
- 大頭貼 + bio 在頂部
- 統計按鈕網格（4個）
- 徽章系統（Top Collector, Influencer）
- Collections 分頁（Images / Companies）
- Inline 編輯 modal

---

## 🚀 部署步驟

### Step 1: 執行 Database Migration
```bash
# 方法 A: 直接執行 SQL 檔案
supabase db push

# 方法 B: 在 Supabase Dashboard SQL Editor 手動執行
# 複製 supabase/migrations/20251006_user_profile_feature.sql 內容並執行
```

### Step 2: 重新生成 TypeScript 類型
```bash
supabase gen types typescript --project-id jufwllhkgtvovyazgxld > src/core/infrastructure/supabase/database.types.ts
```

### Step 3: 添加路由（如需要）
```typescript
// src/core/router/index.tsx
<Route path="/profile/:userId" element={<ProfileStatsPage />} />
<Route path="/profile/:userId/collections" element={<CollectionsPage />} />
```

### Step 4: 測試功能
```bash
npm run dev

# 訪問
http://localhost:5173/profile/{userId}
http://localhost:5173/profile/{userId}/collections
```

---

## 📊 資料庫查詢範例

### 獲取用戶統計
```sql
SELECT * FROM user_stats WHERE user_id = 'your-user-id';
```

### 獲取用戶徽章
```sql
SELECT calculate_user_badges('your-user-id');
```

### 獲取收藏圖片
```sql
SELECT * FROM user_collected_images 
WHERE user_id = 'your-user-id' 
ORDER BY collected_at DESC 
LIMIT 20;
```

### 獲取關注公司
```sql
SELECT * FROM user_followed_companies 
WHERE user_id = 'your-user-id' 
ORDER BY followed_at DESC 
LIMIT 20;
```

---

## 🔑 核心功能

### ✅ 已實作
- Instagram-like 個人資料頁面（大頭貼 + bio + 統計按鈕）
- 徽章系統（Top Collector >100 images, Active Contributor >50 responses, Influencer >100 followers）
- Collections 頁面（Images grid + Companies cards）
- Tabs 切換（淡入淡出動畫）
- Infinite scroll（IntersectionObserver）
- Inline edit modal（avatar upload + validation）
- **Realtime 統計更新**（Supabase Realtime 訂閱 follows/bookmarks/comments）
- Homeowner 只能看自己的資料（RLS policies）
- Repository Pattern + Mapper Layer
- TypeScript strict mode（no any）
- i18n 多語言
- Mobbin 黑白灰主題 + Framer Motion 動畫

### 🔄 Future Enhancements
- Share folders 功能
- Demands attach
- 3D avatar
- Profile themes
- Activity timeline
- Social graph visualization

---

## 📝 API 使用範例

```typescript
// 獲取用戶統計
const result = await profileStatsRepository.fetchUserStats(userId);

// 訂閱 Realtime 更新
const unsubscribe = profileStatsRepository.subscribeToStats(userId, (updatedStats) => {
  dispatch(updateStatsRealtime(updatedStats));
});

// 獲取收藏圖片（分頁）
const images = await profileStatsRepository.fetchCollectedImages(userId, 20, 0);

// 獲取關注公司（分頁）
const companies = await profileStatsRepository.fetchFollowedCompanies(userId, 20, 0);
```

---

## 📦 檔案清單

### SQL
- `supabase/migrations/20251006_user_profile_feature.sql`

### Domain
- `src/features/profile/domain/Profile.types.ts` (updated)

### Infrastructure
- `src/features/profile/infrastructure/ProfileStatsMapper.ts`
- `src/features/profile/infrastructure/ProfileStatsRepository.ts`

### Store
- `src/features/profile/store/profileStatsSlice.ts`

### Components
- `src/features/profile/components/ProfileStatsPage.tsx`
- `src/features/profile/components/CollectionsPage.tsx`
- `src/features/profile/components/EditProfileModal.tsx`

### Store Integration
- `src/core/store/store.ts` (updated)

### i18n
- `src/locales/en.json` (updated)
- `src/locales/zh-TW.json` (updated)

---

## 🎯 技術亮點

1. **Repository Pattern**: 清晰的資料存取層
2. **Mapper Layer**: Domain 和 Infrastructure 分離
3. **Redux-first**: 所有狀態管理集中在 Redux
4. **Realtime Updates**: Supabase Realtime 自動更新統計
5. **Infinite Scroll**: IntersectionObserver 優化性能
6. **TypeScript Strict**: 無 any, 完整型別
7. **Framer Motion**: 流暢的動畫效果
8. **RLS Security**: 用戶只能讀取自己的資料
9. **i18n Ready**: 完整多語言支援
10. **Mobbin Design**: 專業設計系統

---

**User Profile Feature 完成！** 🎉

執行 migration → 測試 UI → 驗證 Realtime → 上線
