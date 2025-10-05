#!/bin/bash
# 快速啟動開發伺服器

echo "🧹 清除快取..."
rm -rf node_modules/.vite

echo "🚀 啟動開發伺服器..."
npm run dev
