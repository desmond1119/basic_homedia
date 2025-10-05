#!/bin/bash

# 🧹 清理 Git 历史中的敏感信息
# ⚠️ 警告：此脚本会重写 Git 历史，务必先备份！

set -e

echo "🔐 Git 历史清理工具"
echo "===================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查是否在 Git 仓库中
if [ ! -d .git ]; then
    echo -e "${RED}错误：不在 Git 仓库中！${NC}"
    exit 1
fi

# 步骤 1: 确认操作
echo -e "${YELLOW}⚠️  警告：此操作将重写 Git 历史！${NC}"
echo ""
echo "这将："
echo "  1. 从所有历史提交中移除 .env.example 中的真实 key"
echo "  2. 重写整个提交历史"
echo "  3. 需要强制推送到远程仓库"
echo ""
echo -e "${YELLOW}建议先备份仓库！${NC}"
echo ""
read -p "是否继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 步骤 2: 创建备份
echo ""
echo -e "${BLUE}📦 创建备份...${NC}"
BACKUP_DIR="../basie_media_backup_$(date +%Y%m%d_%H%M%S)"
cp -r . "$BACKUP_DIR"
echo -e "${GREEN}✅ 备份已创建: $BACKUP_DIR${NC}"

# 步骤 3: 安装 git-filter-repo（如果需要）
if ! command -v git-filter-repo &> /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  git-filter-repo 未安装${NC}"
    echo "正在尝试安装..."
    
    if command -v brew &> /dev/null; then
        brew install git-filter-repo
    elif command -v pip3 &> /dev/null; then
        pip3 install git-filter-repo
    else
        echo -e "${RED}无法自动安装 git-filter-repo${NC}"
        echo "请手动安装："
        echo "  brew install git-filter-repo"
        echo "或"
        echo "  pip3 install git-filter-repo"
        exit 1
    fi
fi

# 步骤 4: 清理 .env.example 的历史版本
echo ""
echo -e "${BLUE}🧹 清理 .env.example 历史...${NC}"

# 方法：替换 .env.example 文件内容
git filter-repo --force --path .env.example --invert-paths

# 重新添加安全的 .env.example
git add .env.example
git commit -m "security: Add sanitized .env.example template" || true

echo -e "${GREEN}✅ 历史清理完成${NC}"

# 步骤 5: 清理引用
echo ""
echo -e "${BLUE}🧹 清理 Git 引用...${NC}"
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo -e "${GREEN}✅ 引用清理完成${NC}"

# 步骤 6: 验证
echo ""
echo -e "${BLUE}🔍 验证清理结果...${NC}"
SENSITIVE_COUNT=$(git log --all --oneline | wc -l)
echo "总提交数: $SENSITIVE_COUNT"

# 检查是否还有敏感信息
if git log -p --all | grep -q "eyJ[a-zA-Z0-9_-]{40,}"; then
    echo -e "${YELLOW}⚠️  历史中仍可能包含敏感信息${NC}"
else
    echo -e "${GREEN}✅ 历史中未发现明显的敏感信息${NC}"
fi

echo ""
echo -e "${GREEN}🎉 清理完成！${NC}"
echo ""
echo "下一步："
echo "  1. 检查远程仓库地址: git remote -v"
echo "  2. 强制推送到 GitHub: git push origin --force --all"
echo "  3. 强制推送标签: git push origin --force --tags"
echo ""
echo -e "${YELLOW}⚠️  注意：强制推送会覆盖远程仓库！${NC}"
