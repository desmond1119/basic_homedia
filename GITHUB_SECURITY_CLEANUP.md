# 🔐 GitHub 敏感信息清理指南

## 📋 当前状态

- ✅ `.env.example` 已清理（本地）
- ❌ GitHub 历史中仍包含旧的 Supabase Key
- 🎯 目标：完全清除 GitHub 上的敏感信息

---

## 🚨 最重要：先轮换 Supabase Key！

**在清理 Git 历史之前，必须先使旧 Key 失效！**

### 步骤：

1. 访问 [Supabase Dashboard](https://app.supabase.com/project/jufwllhkgtvovyazgxld/settings/api)
2. 点击 **"Generate new anon key"** 或在 Configuration 中轮换密钥
3. 复制新的 `anon key` 和 `url`
4. 更新本地 `.env` 文件：
   ```bash
   # 编辑 .env
   VITE_SUPABASE_URL=https://jufwllhkgtvovyazgxld.supabase.co
   VITE_SUPABASE_ANON_KEY=<新的-key>
   ```
5. 测试应用是否正常：`npm run dev`

✅ **完成后，旧 Key 已经失效，即使泄露也无法使用**

---

## 🛠️ 方案选择

### 方案 A：完全重建仓库（最简单，推荐）⭐

**优点：**
- 最简单、最彻底
- 不需要复杂工具
- 保证干净

**缺点：**
- 失去所有 Git 历史
- 失去所有 Stars/Forks

**适用场景：** 如果这是新项目，没有重要的历史记录

---

### 方案 B：使用 BFG Repo-Cleaner（推荐）⭐⭐⭐

**优点：**
- 保留提交历史
- 速度快
- 专为清理敏感信息设计

**缺点：**
- 需要安装工具
- 需要团队成员重新克隆

**适用场景：** 想保留 Git 历史但清除敏感信息

---

### 方案 C：使用 git-filter-repo（进阶）

**优点：**
- Git 官方推荐
- 功能强大

**缺点：**
- 操作复杂
- 容易出错

---

## 📝 方案 A：完全重建仓库（推荐新项目）

### 1. 备份当前代码

```bash
# 1. 进入项目目录
cd /Users/gooday/Documents/最好/basie_media

# 2. 创建备份
cp -r . ../basie_media_backup

# 3. 确认备份成功
ls ../basie_media_backup
```

### 2. 删除 Git 历史，重新初始化

```bash
# 1. 删除 .git 目录（⚠️ 删除所有历史）
rm -rf .git

# 2. 重新初始化 Git
git init

# 3. 添加所有文件（.env 会被 .gitignore 自动忽略）
git add .

# 4. 创建初始提交
git commit -m "Initial commit with security fixes

- Removed sensitive keys from .env.example
- Added comprehensive security documentation
- Implemented security check scripts"
```

### 3. 连接到 GitHub

```bash
# 1. 检查是否有远程仓库
git remote -v

# 2. 如果没有，添加远程仓库（替换你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 或者如果已存在，更新它
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 3. 强制推送（覆盖远程仓库）
git push -u origin main --force

# 或者如果分支是 master
git push -u origin master --force
```

### 4. 在 GitHub 上确认

1. 访问你的 GitHub 仓库
2. 检查提交历史（应该只有 1 个新的初始提交）
3. 检查 `.env.example` 内容（应该只有占位符）

✅ **完成！GitHub 现在是干净的**

---

## 📝 方案 B：使用 BFG Repo-Cleaner

### 1. 安装 BFG

```bash
# macOS
brew install bfg

# 或下载 JAR 文件
# https://rtyley.github.io/bfg-repo-cleaner/
```

### 2. 备份仓库

```bash
# 创建完整备份
cd /Users/gooday/Documents/最好
cp -r basie_media basie_media_backup
```

### 3. 创建替换文件

```bash
cd /Users/gooday/Documents/最好/basie_media

# 创建包含要删除的敏感信息的文件
cat > secrets.txt << 'EOF'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1ZndsbGhrZ3R2b3Z5YXpneGxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MDU4NTYsImV4cCI6MjA3NTE4MTg1Nn0.Qr5U__VbJg6PUwpNyPaQUFlut8IvURLW19_DOoXAx9M
EOF
```

### 4. 运行 BFG 清理

```bash
# 清理所有历史中的敏感字符串
bfg --replace-text secrets.txt .git

# 清理 Git 对象
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 删除临时文件
rm secrets.txt
```

### 5. 验证并推送

```bash
# 验证历史
git log -p --all | grep -i "eyJ" || echo "✅ 未发现敏感信息"

# 强制推送到 GitHub
git push origin --force --all
git push origin --force --tags
```

### 6. 通知团队成员

如果有其他开发者，他们需要：

```bash
# 删除本地仓库
rm -rf basie_media

# 重新克隆
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
```

---

## 📝 方案 C：使用 git-filter-repo

### 1. 安装 git-filter-repo

```bash
# macOS
brew install git-filter-repo

# 或使用 pip
pip3 install git-filter-repo
```

### 2. 备份并清理

```bash
# 1. 备份
cd /Users/gooday/Documents/最好
cp -r basie_media basie_media_backup

# 2. 进入项目
cd basie_media

# 3. 从历史中完全删除 .env.example
git filter-repo --path .env.example --invert-paths --force

# 4. 重新添加安全的 .env.example
git add .env.example
git commit -m "security: Add sanitized .env.example"

# 5. 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 3. 重新连接远程仓库并推送

```bash
# filter-repo 会删除远程连接，需重新添加
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 强制推送
git push origin --force --all
git push origin --force --tags
```

---

## ✅ 验证清理结果

### 1. 本地验证

```bash
# 运行安全检查脚本
./scripts/security-check.sh

# 手动检查 Git 历史
git log --all --oneline | head -20
git log -p --all | grep -i "eyJ" || echo "✅ 干净"

# 检查 .env.example
cat .env.example
```

### 2. GitHub 验证

1. 访问 GitHub 仓库：`https://github.com/YOUR_USERNAME/YOUR_REPO`
2. 点击 **Commits** 查看历史
3. 随机打开几个提交，查看 `.env.example` 的内容
4. 确认没有真实的 Key

### 3. 搜索验证

在 GitHub 仓库页面：
- 按 `/` 打开搜索
- 搜索 `eyJhbGciOiJIUzI1NiIs`
- 应该显示 **No results**

---

## 🔒 额外安全措施

### 1. 启用 GitHub Secret Scanning

1. 访问仓库 **Settings** > **Security & analysis**
2. 启用 **Secret scanning**
3. 启用 **Push protection**

### 2. 添加 Pre-commit Hook

```bash
# 安装 husky
npm install -D husky

# 初始化
npx husky install

# 添加 pre-commit hook
npx husky add .husky/pre-commit "npm run security-check"

# 在 package.json 添加脚本
# "security-check": "./scripts/security-check.sh"
```

### 3. 配置 .gitignore

确保以下文件被忽略：

```bash
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets.txt
```

---

## 📞 如果清理失败

### 联系 GitHub Support

如果敏感信息仍然可见：

1. 访问：https://support.github.com/contact
2. 选择 **Sensitive Data Removal**
3. 提供：
   - 仓库 URL
   - 敏感信息的位置
   - 证明你是仓库所有者

GitHub 会手动帮你清理。

---

## 🎯 推荐执行步骤

**对于你的项目，我推荐使用方案 A（完全重建）：**

```bash
# 1. 确保 Supabase Key 已轮换（最重要！）

# 2. 备份
cd /Users/gooday/Documents/最好/basie_media
cp -r . ../basie_media_backup

# 3. 删除 Git 历史
rm -rf .git

# 4. 重新初始化
git init
git add .
git commit -m "Initial commit with security fixes"

# 5. 连接 GitHub（替换你的仓库地址）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 6. 强制推送
git push -u origin main --force
```

**为什么推荐方案 A？**
- ✅ 最简单，不会出错
- ✅ 最彻底，保证干净
- ✅ 你的项目还很新，历史记录不重要
- ✅ 可以保留代码，只是重建历史

---

## ✅ 完成检查清单

清理完成后，确认：

- [ ] ✅ Supabase Key 已在 Dashboard 轮换
- [ ] ✅ `.env.example` 只包含占位符
- [ ] ✅ `.env` 文件被 `.gitignore` 忽略
- [ ] ✅ Git 历史已清理或重建
- [ ] ✅ GitHub 上无敏感信息（手动搜索确认）
- [ ] ✅ 应用使用新 Key 正常运行
- [ ] ✅ 团队成员已通知重新克隆（如果有）
- [ ] ✅ 备份已保存在安全位置

---

**需要帮助？** 如果遇到问题，随时告诉我！
