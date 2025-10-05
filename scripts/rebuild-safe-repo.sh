#!/bin/bash

# 🔄 安全重建 Git 仓库
# 这个脚本会删除所有 Git 历史，创建一个干净的新仓库

set -e

echo "🔐 安全重建 Git 仓库"
echo "===================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误：不在项目根目录！${NC}"
    exit 1
fi

# 警告
echo -e "${YELLOW}⚠️  警告：此操作将删除所有 Git 历史！${NC}"
echo ""
echo "这将："
echo "  1. 删除所有提交历史"
echo "  2. 创建一个全新的 Git 仓库"
echo "  3. 保留所有代码文件"
echo "  4. 需要强制推送到 GitHub"
echo ""

# 确认
read -p "确定要继续吗？输入 'YES' 确认: " confirm

if [ "$confirm" != "YES" ]; then
    echo "操作已取消"
    exit 0
fi

# 步骤 1: 创建备份
echo ""
echo -e "${BLUE}📦 步骤 1/5: 创建备份...${NC}"
BACKUP_DIR="../basie_media_backup_$(date +%Y%m%d_%H%M%S)"
cp -r . "$BACKUP_DIR"
echo -e "${GREEN}✅ 备份已创建: $BACKUP_DIR${NC}"

# 步骤 2: 保存当前的远程仓库地址
echo ""
echo -e "${BLUE}💾 步骤 2/5: 保存远程仓库信息...${NC}"
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE_URL" ]; then
    echo -e "${YELLOW}⚠️  未检测到远程仓库${NC}"
    read -p "请输入 GitHub 仓库地址 (例如: https://github.com/username/repo.git): " REMOTE_URL
fi
echo "远程仓库: $REMOTE_URL"

# 步骤 3: 删除 Git 历史
echo ""
echo -e "${BLUE}🗑️  步骤 3/5: 删除旧的 Git 历史...${NC}"
rm -rf .git
echo -e "${GREEN}✅ 旧历史已删除${NC}"

# 步骤 4: 初始化新仓库
echo ""
echo -e "${BLUE}🆕 步骤 4/5: 初始化新仓库...${NC}"

# 初始化
git init

# 检查默认分支名
DEFAULT_BRANCH=$(git config --get init.defaultBranch || echo "main")
if [ "$DEFAULT_BRANCH" != "main" ] && [ "$DEFAULT_BRANCH" != "master" ]; then
    DEFAULT_BRANCH="main"
fi

# 添加所有文件
git add .

# 创建初始提交
git commit -m "Initial commit - Security cleanup completed

- Removed all sensitive information from history
- Updated .env.example with placeholders only
- Added comprehensive security documentation
- Implemented security check scripts
- Added pre-commit hooks configuration

Features:
- ✅ Authentication system (multi-role)
- ✅ Forum system with posts/comments
- ✅ Pinterest-style inspiration feed
- ✅ Provider profiles & portfolios
- ✅ i18n support (zh-TW, en, zh-CN)
- ✅ Supabase backend integration
- ✅ TypeScript strict mode
- ✅ Redux Toolkit state management"

echo -e "${GREEN}✅ 新仓库已初始化${NC}"

# 步骤 5: 连接远程仓库
echo ""
echo -e "${BLUE}🔗 步骤 5/5: 连接远程仓库...${NC}"
git remote add origin "$REMOTE_URL"

# 设置上游分支
git branch -M "$DEFAULT_BRANCH"

echo -e "${GREEN}✅ 远程仓库已连接${NC}"

# 完成
echo ""
echo -e "${GREEN}🎉 安全重建完成！${NC}"
echo ""
echo "=================================================="
echo ""
echo "📋 接下来的步骤："
echo ""
echo "1. 检查状态:"
echo "   git log --oneline"
echo ""
echo "2. 强制推送到 GitHub (会覆盖远程仓库):"
echo "   git push -u origin $DEFAULT_BRANCH --force"
echo ""
echo "3. 如果有其他分支，也推送它们:"
echo "   git push origin --force --all"
echo ""
echo "4. 推送标签（如果有）:"
echo "   git push origin --force --tags"
echo ""
echo -e "${YELLOW}⚠️  注意事项：${NC}"
echo "- 强制推送会覆盖 GitHub 上的所有历史"
echo "- 其他开发者需要重新克隆仓库"
echo "- Stars 和 Forks 会保留"
echo "- Issues 和 Pull Requests 会保留"
echo ""
echo "=================================================="
echo ""
echo -e "${BLUE}📝 推送命令（复制执行）:${NC}"
echo ""
echo "git push -u origin $DEFAULT_BRANCH --force"
echo ""
