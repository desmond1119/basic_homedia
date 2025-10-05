#!/bin/bash
set -e

echo "🧹 Cleaning up duplicate .new.tsx files..."

# Find and delete all .new.tsx files
find src -name "*.new.tsx" -type f -delete

echo "✅ Cleanup complete!"

# List remaining files to verify
echo "📋 Verifying cleanup..."
if find src -name "*.new.tsx" -type f | grep -q .; then
  echo "⚠️  Warning: Some .new.tsx files still exist"
  find src -name "*.new.tsx" -type f
else
  echo "✅ All .new.tsx files removed"
fi
