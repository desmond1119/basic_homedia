# Enterprise Setup Guide

## Initial Setup

```bash
# Install dependencies
npm install

# Generate Supabase types
npm run gen:types

# Setup Playwright
npx playwright install
```

## Environment Variables

Create `.env.local`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_SENTRY_DSN=your_sentry_dsn
SUPABASE_PROJECT_ID=your_project_id
```

## Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with UI
npm test:ui

# Run E2E tests
npm run test:e2e

# Start Storybook
npm run storybook
```

## Production Build

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview
npm run preview
```

## Migrate from Old to New Components

### 1. Remove duplicate files
```bash
rm src/features/forum/components/PostCard.tsx
rm src/features/forum/components/CommentSection.tsx
rm src/features/forum/components/PostDetailPage.tsx
rm src/features/provider/components/ProviderProfilePage.tsx
rm src/features/auth/components/LoginPage.tsx
rm src/shared/components/LanguageSwitcher.tsx

mv src/features/forum/components/PostCard.new.tsx src/features/forum/components/PostCard.tsx
mv src/features/forum/components/CommentSection.new.tsx src/features/forum/components/CommentSection.tsx
mv src/features/forum/components/PostDetailPage.new.tsx src/features/forum/components/PostDetailPage.tsx
mv src/features/provider/components/ProviderProfilePage.new.tsx src/features/provider/components/ProviderProfilePage.tsx
mv src/features/auth/components/LoginPage.new.tsx src/features/auth/components/LoginPage.tsx
mv src/shared/components/LanguageSwitcher.new.tsx src/shared/components/LanguageSwitcher.tsx
```

### 2. Update imports
```bash
# Replace ForumPage with optimized version
mv src/features/forum/components/ForumPage.optimized.tsx src/features/forum/components/ForumPage.tsx

# Replace App
mv src/App.optimized.tsx src/App.tsx

# Replace main
mv src/main.optimized.tsx src/main.tsx

# Replace store
mv src/core/store/store.optimized.ts src/core/store/store.ts
```

## Feature Flags

Enable/disable features in browser console:

```javascript
// Enable new features
featureFlags.enable('advancedSearch');
featureFlags.enable('aiRecommendations');

// Check status
featureFlags.isEnabled('newForumUI'); // true

// Get all flags
featureFlags.getAll();
```

## Plugin System

Register custom plugins:

```typescript
import { pluginManager } from '@/core/services/PluginManager';

pluginManager.register({
  name: 'analytics',
  version: '1.0.0',
  init: async () => {
    console.log('Analytics plugin initialized');
  },
  destroy: () => {
    console.log('Analytics plugin destroyed');
  },
});
```

## Performance Monitoring

Sentry automatically captures:
- Errors and exceptions
- Performance metrics
- User sessions (10% sample rate)
- Error replays (100% on errors)

## Testing Strategy

1. **Unit Tests**: Vitest for logic and utilities
2. **Component Tests**: Storybook for UI components
3. **Integration Tests**: Vitest + React Testing Library
4. **E2E Tests**: Playwright for critical user flows

## Deployment Checklist

- [ ] Run `npm run type-check`
- [ ] Run `npm test`
- [ ] Run `npm run test:e2e`
- [ ] Set production environment variables
- [ ] Enable Sentry DSN
- [ ] Build with `npm run build`
- [ ] Test preview with `npm run preview`
