#!/bin/bash
# 快速重建仓库脚本

set -e

echo "🔄 开始重建仓库..."

# 保存远程地址
REMOTE_URL=$(git remote get-url origin)
echo "远程仓库: $REMOTE_URL"

# 删除 .git
echo "删除旧历史..."
rm -rf .git

# 重新初始化
echo "初始化新仓库..."
git init
git branch -M main

# 添加所有文件
echo "添加文件..."
git add .

# 创建初始提交
echo "创建提交..."
git commit -m "Initial commit - Basie Media Platform

🏗️ Renovation Platform - Enterprise-grade React application

## Features
✅ Authentication system (multi-role: homeowner/provider/admin)
✅ Forum system with posts, comments, likes
✅ Pinterest-style inspiration feed
✅ Provider profiles & portfolios  
✅ User profiles with follow system
✅ Private messaging
✅ i18n support (zh-TW, en, zh-CN)
✅ Real-time updates (Supabase)
✅ TypeScript strict mode
✅ Redux Toolkit state management
✅ Comprehensive security measures

## Tech Stack
- React 18.3 + TypeScript 5.8
- Redux Toolkit 2.9 + RTK Query
- Supabase (PostgreSQL + Auth + Storage)
- TailwindCSS 3.4 + Framer Motion
- Vite 5.4
- Vitest + Playwright

## Security
- Row Level Security (RLS) enabled
- Environment variables properly managed
- Pre-commit security checks
- Automated security scanning

## Documentation
- Comprehensive setup guides
- Security best practices
- API documentation
- Testing guidelines"

# 连接远程
echo "连接远程仓库..."
git remote add origin "$REMOTE_URL"

echo "✅ 重建完成！"
echo ""
echo "执行推送命令："
echo "git push -u origin main --force"
