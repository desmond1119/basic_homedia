#!/bin/bash

# 🔐 安全检查脚本
# 用途：检查项目中的敏感信息泄露

set -e

echo "🔍 开始安全检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查计数
ISSUES=0

# 1. 检查 .env 文件是否被 gitignore
echo "📋 检查 1: .env 文件是否被忽略"
if git check-ignore .env > /dev/null 2>&1; then
    echo -e "${GREEN}✅ .env 已被 gitignore${NC}"
else
    echo -e "${RED}❌ .env 未被 gitignore！${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. 检查 .env.example 中是否有真实的 key
echo "📋 检查 2: .env.example 中的敏感信息"
if [ -f .env.example ]; then
    # 检查是否包含看起来像真实 JWT 的字符串
    if grep -qE "eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}" .env.example; then
        echo -e "${RED}❌ .env.example 可能包含真实的 JWT token！${NC}"
        ISSUES=$((ISSUES + 1))
    else
        echo -e "${GREEN}✅ .env.example 看起来安全${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env.example 不存在${NC}"
fi
echo ""

# 3. 检查是否有 .env 被暂存
echo "📋 检查 3: Git 暂存区"
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo -e "${RED}❌ .env 文件在暂存区中！${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ 暂存区无 .env 文件${NC}"
fi
echo ""

# 4. 检查代码中是否有硬编码的 API key
echo "📋 检查 4: 代码中的硬编码 key"
HARDCODED=$(grep -rE "(sk_live|pk_live|api[_-]?key\s*[=:]\s*['\"][a-zA-Z0-9]{20,})" \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=.git \
    . 2>/dev/null | wc -l)

if [ "$HARDCODED" -gt 0 ]; then
    echo -e "${RED}❌ 发现 $HARDCODED 处可能的硬编码 key！${NC}"
    echo "运行以下命令查看详情："
    echo "grep -rn 'api.*key.*=' --include='*.ts' --include='*.tsx' ."
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ 未发现明显的硬编码 key${NC}"
fi
echo ""

# 5. 检查是否有密码泄露
echo "📋 检查 5: 硬编码密码"
PASSWORDS=$(grep -rE "(password|passwd|pwd)\s*[=:]\s*['\"][^'\"]{8,}" \
    --include="*.ts" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude="*.test.ts" \
    --exclude="*.test.tsx" \
    . 2>/dev/null | wc -l)

if [ "$PASSWORDS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $PASSWORDS 处可能的硬编码密码（可能是测试代码）${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ 未发现硬编码密码${NC}"
fi
echo ""

# 6. 检查 Git 历史中的敏感信息（简单检查最近 10 次提交）
echo "📋 检查 6: Git 历史（最近 10 次提交）"
SENSITIVE_IN_HISTORY=$(git log -10 --all -p | grep -cE "(sk_live|pk_live|eyJ[a-zA-Z0-9_-]{40,})" || echo "0")

if [ "$SENSITIVE_IN_HISTORY" -gt 0 ]; then
    echo -e "${RED}❌ Git 历史中可能包含敏感信息！${NC}"
    echo -e "${YELLOW}   建议：运行 BFG Repo-Cleaner 清理历史${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ 最近提交看起来安全${NC}"
fi
echo ""

# 7. 检查 node_modules 是否被忽略
echo "📋 检查 7: node_modules"
if git check-ignore node_modules > /dev/null 2>&1; then
    echo -e "${GREEN}✅ node_modules 已被 gitignore${NC}"
else
    echo -e "${RED}❌ node_modules 未被忽略！${NC}"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 8. 检查是否有 .git/hooks/pre-commit
echo "📋 检查 8: Pre-commit hook"
if [ -f .git/hooks/pre-commit ] || [ -d .husky ]; then
    echo -e "${GREEN}✅ 已配置 pre-commit hook${NC}"
else
    echo -e "${YELLOW}⚠️  未配置 pre-commit hook（建议安装）${NC}"
fi
echo ""

# 9. 检查 package.json 中的依赖漏洞
echo "📋 检查 9: 依赖安全性"
if command -v npm &> /dev/null; then
    echo "运行 npm audit..."
    VULNERABILITIES=$(npm audit --audit-level=moderate --json 2>/dev/null | grep -o '"total":[0-9]*' | head -1 | grep -o '[0-9]*' || echo "0")
    
    if [ "$VULNERABILITIES" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  发现 $VULNERABILITIES 个依赖漏洞${NC}"
        echo "运行 'npm audit fix' 修复"
    else
        echo -e "${GREEN}✅ 未发现依赖漏洞${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  npm 未安装，跳过依赖检查${NC}"
fi
echo ""

# 10. 检查 Supabase 配置
echo "📋 检查 10: Supabase 配置"
if [ -f .env ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ .env 包含 Supabase 配置${NC}"
    else
        echo -e "${YELLOW}⚠️  .env 缺少 Supabase 配置${NC}"
    fi
else
    echo -e "${RED}❌ .env 文件不存在！${NC}"
    echo "运行: cp .env.example .env"
    ISSUES=$((ISSUES + 1))
fi
echo ""

# 总结
echo "=================================================="
echo ""
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 恭喜！未发现重大安全问题${NC}"
    exit 0
else
    echo -e "${RED}⚠️  发现 $ISSUES 个安全问题需要修复${NC}"
    echo ""
    echo "📖 查看详细修复指南："
    echo "   cat SECURITY_FIX.md"
    echo ""
    exit 1
fi
