#!/bin/bash
# 快速修復腳本 - 生成 Supabase 型別並驗證專案

echo "🚀 開始修復 Supabase 型別..."

# 設置專案 ID（從 .env.example 提取）
export SUPABASE_PROJECT_ID=jufwllhkgtvovyazgxld

# 生成型別
echo "📦 生成 Supabase 型別..."
npm run gen:types

# 驗證型別檢查
echo "🔍 驗證 TypeScript 型別..."
npm run type-check

echo "✅ 修復完成！"
echo ""
echo "下一步："
echo "  npm run dev          # 啟動開發伺服器"
echo "  npm test             # 執行單元測試"
echo "  npm run test:e2e     # 執行 E2E 測試"
echo "  npm run storybook    # 啟動 Storybook"
