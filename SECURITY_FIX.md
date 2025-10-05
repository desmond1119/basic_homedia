# 🔐 安全问题修复指南

## ⚠️ 紧急：Supabase Key 已泄露

你的 Supabase Anon Key 已经提交到 Git 历史记录中，**必须立即轮换**！

---

## 🚨 立即执行步骤

### 步骤 1: 轮换 Supabase API Key（最重要！）

1. **访问 Supabase Dashboard**
   ```
   https://app.supabase.com/project/jufwllhkgtvovyazgxld/settings/api
   ```

2. **点击 "Generate new anon key"** 或 "Rotate API Keys"
   - 这会立即使旧 Key 失效
   - 生成新的 anon key

3. **更新本地 .env 文件**
   ```bash
   # 创建 .env 文件（如果不存在）
   cp .env.example .env
   
   # 编辑 .env，填入新的 Key
   VITE_SUPABASE_URL=https://jufwllhkgtvovyazgxld.supabase.co
   VITE_SUPABASE_ANON_KEY=<新的-anon-key>
   ```

4. **确认 .env 在 .gitignore 中**
   ```bash
   # 检查
   cat .gitignore | grep ".env"
   # ✅ 应该看到 .env 已被忽略
   ```

---

### 步骤 2: 清理 Git 历史（可选但推荐）

⚠️ **如果代码已经推送到公开仓库，必须执行此步骤！**

#### 方法 A: 使用 BFG Repo-Cleaner（推荐）

```bash
# 1. 安装 BFG
brew install bfg  # macOS
# 或下载：https://rtyley.github.io/bfg-repo-cleaner/

# 2. 创建仓库备份
cd /Users/gooday/Documents/最好
cp -r basie_media basie_media_backup

# 3. 清理敏感文件
cd basie_media
bfg --replace-text <(echo 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZndsbGhrZ3R2b3Z5YXpneGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDU4NTYsImV4cCI6MjA3NTE4MTg1Nn0.Qr5U__VbJg6PUwpNyPaQUFlut8IvURLW19_DOoXAx9M===>***REMOVED***')

# 4. 清理历史
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. 强制推送（⚠️ 会覆盖远程仓库）
git push origin --force --all
git push origin --force --tags
```

#### 方法 B: 使用 git filter-branch（备选）

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.example" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

---

### 步骤 3: 检查其他潜在泄露

```bash
# 搜索其他可能的敏感信息
cd /Users/gooday/Documents/最好/basie_media

# 检查是否有其他 key 泄露
grep -r "sk_live\|pk_live\|api[_-]key\|secret" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" .

# 检查是否有密码
grep -r "password.*=" --include="*.ts" --include="*.tsx" .
```

---

## ✅ 验证修复

### 1. 确认 .env.example 已更新
```bash
cat .env.example
# 应该只看到占位符，没有真实 key
```

### 2. 确认 .env 不在 Git 中
```bash
git status
# .env 不应该出现在 Untracked files
```

### 3. 确认应用可以正常运行
```bash
npm run dev
# 使用新 Key 测试登录/注册功能
```

---

## 🛡️ 长期安全最佳实践

### 1. 环境变量管理

**✅ 正确做法：**
```bash
# .env （从不提交）
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=真实的key

# .env.example （可以提交）
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**❌ 错误做法：**
```bash
# ❌ 在 .env.example 中放真实 key
# ❌ 在代码中硬编码 key
# ❌ 在注释中放 key
```

### 2. 配置生产环境变量

**Vercel 部署：**
```bash
# 在 Vercel Dashboard 设置
Settings > Environment Variables
添加：
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
```

**Netlify 部署：**
```bash
Site settings > Build & deploy > Environment
添加同样的变量
```

### 3. 使用 Secret 管理工具

**推荐工具：**
- **1Password CLI** - 团队密码管理
- **AWS Secrets Manager** - 云端 Secret
- **HashiCorp Vault** - 企业级
- **Doppler** - 开发者友好

**示例：使用 Doppler**
```bash
# 安装
brew install dopplerhq/cli/doppler

# 设置
doppler setup
doppler secrets set VITE_SUPABASE_URL="xxx"

# 运行应用
doppler run -- npm run dev
```

### 4. Pre-commit Hook 检查

创建 `.husky/pre-commit`:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 检查是否有敏感信息
if git diff --cached --name-only | grep -q "\.env$"; then
  echo "⚠️  Error: Attempting to commit .env file!"
  exit 1
fi

# 检查代码中是否有可疑的 key
if git diff --cached | grep -qE "(sk_live|pk_live|api[_-]key.*=.*['\"][a-zA-Z0-9]{20,})"; then
  echo "⚠️  Warning: Possible API key in code!"
  exit 1
fi
```

### 5. GitHub Secret Scanning

如果使用 GitHub：
1. 启用 **Secret scanning**
2. 启用 **Push protection**
3. 设置 **Dependabot alerts**

配置文件 `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### 6. 使用不同级别的 Key

```typescript
// ✅ 前端使用 Anon Key（权限受 RLS 限制）
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ❌ 永远不要在前端使用 Service Role Key
// Service Role Key 绕过所有 RLS，只能在后端使用
```

---

## 📋 安全检查清单

部署前确保：

- [ ] ✅ Supabase Key 已轮换
- [ ] ✅ .env.example 只包含占位符
- [ ] ✅ .env 在 .gitignore 中
- [ ] ✅ Git 历史中的敏感信息已清理
- [ ] ✅ 生产环境变量已在部署平台配置
- [ ] ✅ Row Level Security (RLS) 已启用
- [ ] ✅ Service Role Key 从未暴露
- [ ] ✅ API 限流已配置（Supabase Dashboard）
- [ ] ✅ 数据库密码强度足够
- [ ] ✅ 启用 2FA（Supabase 账户）

---

## 🆘 如果 Key 已在公开仓库

如果你的代码在公开的 GitHub/GitLab：

1. **立即轮换所有 Key** ✅
2. **检查 Supabase 日志**
   ```
   Dashboard > Logs > API Logs
   查看是否有异常访问
   ```
3. **重置数据库密码**
4. **检查是否有异常数据**
5. **监控账单**
   - 查看是否有异常的 API 调用量
6. **考虑迁移项目**
   - 如果怀疑被攻击，创建新的 Supabase 项目

---

## 📞 需要帮助？

**Supabase 支持：**
- Discord: https://discord.supabase.com
- Docs: https://supabase.com/docs/guides/api#api-keys

**安全事件报告：**
- 如发现数据泄露，立即联系 security@supabase.io

---

## ✅ 修复完成确认

执行以下命令验证：

```bash
# 1. 检查 .env.example 无真实 key
cat .env.example

# 2. 检查 .env 被忽略
git check-ignore .env
# 应该输出: .env

# 3. 检查 Git 历史（耗时较长）
git log -p --all | grep -i "anon.*key" | head -5
# 理想情况：应该看不到真实的 key

# 4. 测试应用
npm run dev
# 登录/注册应该正常工作
```

**全部通过？恭喜，安全问题已修复！🎉**

---

**最后提醒：** 安全是持续的过程，不是一次性任务。定期审查、更新依赖、监控日志。
