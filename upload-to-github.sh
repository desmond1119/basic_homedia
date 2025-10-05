#!/bin/bash

set -e

REPO_URL="https://github.com/desmond1119/basic_homedia.git"
BRANCH="main"

echo "🚀 Starting GitHub upload process..."

if [ ! -d ".git" ]; then
  echo "📦 Initializing Git repository..."
  git init
  git remote add origin "$REPO_URL"
  
  if [ ! -f ".gitignore" ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Misc
*.tsbuildinfo
.cache/
.parcel-cache/
EOF
  fi
fi

echo "🔍 Checking for sensitive files..."
if [ -f ".env" ]; then
  if ! grep -q ".env" .gitignore; then
    echo ".env" >> .gitignore
    echo "⚠️  Added .env to .gitignore"
  fi
fi

echo "➕ Staging files..."
git add .

echo "💾 Committing changes..."
COMMIT_MSG="${1:-Update with new features from AI}"
git commit -m "$COMMIT_MSG" || echo "No changes to commit"

echo "🌐 Pushing to GitHub..."
git branch -M "$BRANCH"

if git remote get-url origin > /dev/null 2>&1; then
  git remote set-url origin "$REPO_URL"
else
  git remote add origin "$REPO_URL"
fi

git push -u origin "$BRANCH"

echo "✅ Upload complete!"
echo "🔗 Repository: $REPO_URL"
