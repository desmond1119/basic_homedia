# UI Style Update - Pinterest Input Style Complete

## 更新日期
2025-10-06

## 更新概要
已成功將所有輸入框樣式更新為 Pinterest 風格，並將頁面背景統一改為白色，與 `/login` 頁面保持一致。

## 更新內容

### 1. 全局輸入框樣式 (`src/index.css`)
- ✅ 新增全局 input 和 textarea 樣式
- ✅ 使用 `rounded-full` (完全圓角) 用於 input
- ✅ 使用 `rounded-2xl` 用於 textarea
- ✅ 背景色：`bg-gray-50` (未聚焦) → `bg-white` (聚焦時)
- ✅ 邊框：`border-gray-200` → `border-primary-300` (聚焦時)
- ✅ 聚焦效果：`focus:ring-2 focus:ring-primary-500`
- ✅ 禁用狀態：`bg-gray-100 opacity-50 cursor-not-allowed`

### 2. 共享組件更新

#### Input 組件 (`src/shared/components/Input.tsx`)
- ✅ 標籤顏色：`text-gray-300` → `text-gray-700`
- ✅ 輸入框背景：`bg-gray-900` → `bg-gray-50`
- ✅ 文字顏色：`text-white` → `text-gray-900`
- ✅ 邊框樣式：`border-gray-800` → `border-gray-200`
- ✅ 圓角：`rounded-xl` → `rounded-full`
- ✅ 佔位符：`placeholder:text-gray-500` → `placeholder:text-gray-400`
- ✅ 錯誤提示：`text-red-400` → `text-red-500`

#### Textarea 組件 (`src/shared/components/Textarea.tsx`)
- ✅ 標籤顏色：`text-gray-300` → `text-gray-700`
- ✅ 輸入框背景：`bg-gray-900` → `bg-gray-50`
- ✅ 文字顏色：`text-white` → `text-gray-900`
- ✅ 邊框樣式：`border-gray-800` → `border-gray-200`
- ✅ 圓角：保持 `rounded-2xl`
- ✅ 佔位符：`placeholder:text-gray-500` → `placeholder:text-gray-400`

### 3. 設定頁面 (`src/features/settings/components/SettingsPage.tsx`)
- ✅ 頁面背景：`bg-black` → `bg-white`
- ✅ 標題顏色：`text-white` → `text-gray-900`
- ✅ 副標題：`text-gray-400` → `text-gray-600`
- ✅ 側邊欄背景：`bg-gray-900` → `bg-gray-50`
- ✅ 側邊欄邊框：`border-gray-800` → `border-gray-200`
- ✅ 內容區背景：`bg-gray-900` → `bg-white`
- ✅ 標籤未選中：`text-gray-400 hover:bg-gray-800` → `text-gray-700 hover:bg-gray-100`
- ✅ 移除 disabled input 的自定義背景樣式（使用組件預設）

### 4. 個人檔案編輯表單 (`src/features/profile/components/EditProfileForm.tsx`)
- ✅ 卡片背景：`glass-card` → `bg-white rounded-2xl border border-gray-200 shadow-sm`
- ✅ 標題顏色：`text-white` → `text-gray-900`
- ✅ 標籤顏色：`text-gray-400` → `text-gray-700`
- ✅ 頭像背景：`bg-gray-700` → `bg-red-500`
- ✅ 圖標顏色：`text-black` → `text-gray-900`
- ✅ 上傳提示：`text-shallow` → `text-gray-600`

### 5. 個人檔案編輯彈窗 (`src/features/profile/components/EditProfileModal.tsx`)
- ✅ 所有 input 輸入框：更新為 Pinterest 風格
  - 背景：`bg-white` → `bg-gray-50`
  - 邊框：`border-gray-300` → `border-gray-200`
  - 圓角：`rounded-xl` → `rounded-full`
  - 聚焦效果：統一使用 `focus:ring-primary-500`
- ✅ Textarea：更新為 `rounded-2xl` 並使用相同的顏色方案

## 設計規範

### 輸入框樣式
```css
/* 標準輸入框 (text, email, password, etc.) */
- 背景：bg-gray-50 → bg-white (focus)
- 邊框：border-gray-200 → border-primary-300 (focus)
- 圓角：rounded-full
- 內距：px-4 py-3
- 聚焦環：ring-2 ring-primary-500

/* 多行文字框 (textarea) */
- 背景：bg-gray-50 → bg-white (focus)
- 邊框：border-gray-200 → border-primary-300 (focus)
- 圓角：rounded-2xl
- 內距：px-4 py-3
- 聚焦環：ring-2 ring-primary-500
```

### 顏色方案
- **頁面背景**：`bg-white`
- **卡片背景**：`bg-white` 或 `bg-gray-50`
- **輸入框背景**：`bg-gray-50` (未聚焦) / `bg-white` (聚焦)
- **邊框**：`border-gray-200`
- **文字**：`text-gray-900` (主要) / `text-gray-700` (標籤) / `text-gray-600` (次要)
- **佔位符**：`text-gray-400`
- **主色調**：`primary-500` (紅色)

## 影響範圍
- ✅ 登入頁面 (`/login`) - 已是 Pinterest 風格
- ✅ 註冊頁面 (`/register`) - 繼承全局樣式
- ✅ 設定頁面 (`/settings`) - 已更新
- ✅ 個人檔案編輯表單 - 已更新
- ✅ 個人檔案編輯彈窗 - 已更新
- ✅ 所有使用 Input/Textarea 組件的頁面 - 自動繼承新樣式
- ✅ 所有使用原生 input/textarea 的頁面 - 通過全局 CSS 自動套用

## 測試建議
1. 訪問 `/login` 確認樣式一致性
2. 訪問 `/settings` 確認白色背景和輸入框樣式
3. 測試個人檔案編輯功能
4. 檢查所有表單的聚焦效果
5. 測試禁用狀態的輸入框
6. 確認錯誤提示顯示正確

## 注意事項
- CSS 檔案中的 `@tailwind` 和 `@apply` 警告是正常的，這些是 Tailwind CSS 的指令，會在建置時由 PostCSS 處理
- 所有輸入框現在都會自動套用 Pinterest 風格，無需額外配置
- 如需覆蓋樣式，可在組件中使用 `className` prop
