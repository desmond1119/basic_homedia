#!/bin/bash

# Git Initialization Script for Renovation Platform
# Enterprise-grade version control setup

set -e

echo "🚀 Initializing Git repository..."

# Initialize git if not already initialized
if [ ! -d .git ]; then
  git init
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Create .gitignore
echo "📝 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production build
dist/
build/
*.local

# Environment variables
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# Supabase
.supabase/
supabase/.env
**/supabase/.env

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Testing
coverage/
.nyc_output/

# Misc
*.tsbuildinfo
.cache/
.temp/
.tmp/

# OS
Thumbs.db
EOF

echo "✓ .gitignore created"

# Git configuration
echo "🔧 Configuring Git..."

# Set default branch to main
git config init.defaultBranch main 2>/dev/null || true

# Stage all files
echo "📦 Staging files..."
git add .

# Initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial renovation platform setup

- React 18.3 + TypeScript 5.5 (strict mode)
- Vite 5.4 build tool
- Redux Toolkit 2.9 state management
- Supabase backend (PostgreSQL + Auth + Storage)
- i18n support (zh-TW, en, zh-CN)
- Mobbin-inspired UI/UX (dark theme)
- Forum system with posts, comments, likes
- Authentication system
- TailwindCSS + Framer Motion"

echo "✓ Initial commit created"

# Instructions for remote repository
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Next Steps: Create Remote Repository"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Option 1: GitHub CLI (Recommended)"
echo "  gh repo create basie-media --private --source=. --remote=origin"
echo "  git push -u origin main"
echo ""
echo "Option 2: Manual Setup"
echo "  1. Create repo on GitHub: https://github.com/new"
echo "  2. git remote add origin <your-repo-url>"
echo "  3. git push -u origin main"
echo ""
echo "Option 3: GitLab"
echo "  1. Create repo on GitLab"
echo "  2. git remote add origin <gitlab-repo-url>"
echo "  3. git push -u origin main"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git initialization complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
