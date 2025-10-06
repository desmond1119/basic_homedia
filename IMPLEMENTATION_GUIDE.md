# Implementation Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run SQL Migration
```bash
# Connect to your Supabase database
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/001_idempotent_schema.sql

# Or via Supabase CLI
supabase db push
```

### 3. Regenerate Types
```bash
npm run gen:types
```

### 4. Update Tailwind Config
```bash
cp tailwind.config.pinterest.js tailwind.config.js
```

### 5. Run Development Server
```bash
npm run dev
```

---

## Critical Fixes Required

### 1. Fix JSON Duplicate Keys
In `/src/locales/en.json`, remove duplicate keys:
- Line 376: Duplicate `hero` key
- Line 402: Duplicate `sort` key  
- Line 414: Duplicate `hero` key
- Line 450: Duplicate `sort` key

### 2. Fix PinterestButton Type Issue
Replace `/src/shared/components/PinterestButton.tsx`:

```typescript
import { memo, ReactNode, ButtonHTMLAttributes } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { pinterestClasses } from '../theme/pinterest';

interface PinterestButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  loading?: boolean;
}

export const PinterestButton = memo(({
  children,
  variant = 'primary',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: PinterestButtonProps) => {
  const baseClass = pinterestClasses.button[variant];
  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      className={`${baseClass} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>{children}</span>
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
});

PinterestButton.displayName = 'PinterestButton';
```

### 3. Update AuthContext for HttpOnly Cookies
Add to `/src/features/auth/context/AuthContext.tsx`:

```typescript
import { useCookies } from 'react-cookie';

interface AuthProviderProps {
  children: ReactNode;
  useHttpOnlyCookies?: boolean;
}

export const AuthProvider = ({ children, useHttpOnlyCookies = false }: AuthProviderProps) => {
  const [cookies, setCookie, removeCookie] = useCookies(['auth_token']);
  
  const setAuthToken = (token: string) => {
    if (useHttpOnlyCookies) {
      setCookie('auth_token', token, {
        path: '/',
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    } else {
      localStorage.setItem('auth_token', token);
    }
  };

  const getAuthToken = () => {
    if (useHttpOnlyCookies) {
      return cookies.auth_token;
    }
    return localStorage.getItem('auth_token');
  };

  const removeAuthToken = () => {
    if (useHttpOnlyCookies) {
      removeCookie('auth_token');
    } else {
      localStorage.removeItem('auth_token');
    }
  };

  // Rest of AuthContext implementation...
};
```

### 4. Fix RTK Query Type Errors
After running `npm run gen:types`, the provider_profiles table types will be available. If errors persist:

```typescript
// In providerApi.ts, use type assertion for now:
const { data, error } = await supabase
  .from('provider_profiles')
  .select('*') as { data: ProviderResponse[] | null; error: any };
```

---

## Testing

### Run Unit Tests
```bash
npm run test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run with Coverage
```bash
npm run test:coverage
```

---

## Applying Pinterest Theme

### Update Existing Components

#### Before:
```typescript
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click me
</button>
```

#### After:
```typescript
import { PinterestButton } from '@/shared/components/PinterestButton';

<PinterestButton variant="primary">
  Click me
</PinterestButton>
```

#### Before:
```typescript
<input 
  type="text" 
  className="border rounded px-3 py-2"
  placeholder="Enter text"
/>
```

#### After:
```typescript
import { PinterestInput } from '@/shared/components/PinterestInput';

<PinterestInput 
  type="text"
  placeholder="Enter text"
  label="Your Label"
/>
```

#### Before:
```typescript
<div className="bg-white shadow rounded-lg p-4">
  Content
</div>
```

#### After:
```typescript
import { PinterestCard } from '@/shared/components/PinterestCard';

<PinterestCard>
  <div className="p-4">Content</div>
</PinterestCard>
```

---

## Feature Flags Usage

### Enable/Disable Features
```typescript
import { featureFlags } from '@/core/config/featureFlags';

// Check if enabled
if (featureFlags.isEnabled('cdnImages')) {
  imageUrl = `https://cdn.example.com/${imageUrl}`;
}

// Enable a feature
featureFlags.enable('virtualScrolling');

// Disable a feature
featureFlags.disable('aiRecommendations');

// Toggle a feature
featureFlags.toggle('betaFeatures');
```

### Admin Panel Integration
```typescript
// In AdminDashboardPage
const flags = featureFlags.getAll();

return (
  <div>
    {Object.entries(flags).map(([key, value]) => (
      <div key={key}>
        <label>{key}</label>
        <input
          type="checkbox"
          checked={value}
          onChange={() => featureFlags.toggle(key as keyof FeatureFlags)}
        />
      </div>
    ))}
  </div>
);
```

---

## Error Handling Pattern

### In Components
```typescript
import { ErrorTranslator } from '@/core/services/ErrorTranslator';
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  const handleSubmit = async () => {
    try {
      await supabase.from('posts').insert(data);
    } catch (error) {
      const errorKey = ErrorTranslator.translate(error);
      toast.error(t(errorKey));
    }
  };
};
```

### In RTK Query
```typescript
const { data, error, isLoading } = useGetProvidersQuery({ limit: 20 });

if (error) {
  const errorKey = ErrorTranslator.translate(error);
  return <div>{t(errorKey)}</div>;
}
```

---

## Performance Optimizations

### 1. Enable CDN Images
```typescript
// In image component
const optimizeImage = (url: string) => {
  if (featureFlags.isEnabled('cdnImages')) {
    return `https://cdn.example.com/optimize?url=${encodeURIComponent(url)}&w=800&q=80`;
  }
  return url;
};
```

### 2. Enable Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

### 3. Virtual Scrolling (for large lists)
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualList = ({ items }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div key={virtualRow.index} style={{ transform: `translateY(${virtualRow.start}px)` }}>
            {items[virtualRow.index]}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Security Checklist

- [x] HttpOnly cookies for JWT (feature flag ready)
- [x] Error sanitization (ErrorTranslator)
- [x] TypeScript strict mode
- [x] Input validation (Zod schemas)
- [x] SQL injection prevention (Supabase parameterized queries)
- [ ] CORS configuration (backend)
- [ ] Rate limiting (backend)
- [ ] CSP headers (backend)

---

## Deployment Checklist

### Before Deploy:
1. Run all tests: `npm run test && npm run test:e2e`
2. Build production: `npm run build`
3. Check bundle size: `npm run build -- --stats`
4. Run type check: `npm run type-check`
5. Run linter: `npm run lint`

### Environment Variables:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENABLE_FEATURE_FLAGS=true
VITE_CDN_URL=https://cdn.example.com
```

### Post-Deploy:
1. Monitor Sentry for errors
2. Check feature flag analytics
3. Monitor API performance (RTK Query metrics)
4. Verify httpOnly cookies working

---

## Troubleshooting

### Issue: Type errors in RTK Query
**Solution**: Run `npm run gen:types` after SQL migration

### Issue: react-cookie not found
**Solution**: Run `npm install`

### Issue: Duplicate JSON keys warning
**Solution**: Remove duplicate keys in locales files

### Issue: Images not loading from CDN
**Solution**: Check CDN URL in env vars and feature flag enabled

### Issue: Tests failing
**Solution**: Clear test cache: `npm run test -- --clearCache`

---

## Monitoring & Analytics

### Add Web Vitals
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### Track Feature Flags
```typescript
import * as Sentry from '@sentry/react';

Sentry.setContext('feature_flags', featureFlags.getAll());
```

### API Performance
```typescript
// In store.ts, add RTK Query middleware
import { createListenerMiddleware } from '@reduxjs/toolkit';

const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  matcher: forumApi.endpoints.getPosts.matchFulfilled,
  effect: (action, listenerApi) => {
    console.log('API call completed:', action.meta.requestId);
  },
});
```

---

## Next Steps

1. **Immediate**: Fix duplicate JSON keys and type errors
2. **Short-term**: Migrate remaining Redux slices to RTK Query
3. **Medium-term**: Implement CDN integration
4. **Long-term**: Add A/B testing framework with feature flags

---

## Support

For issues or questions:
1. Check OPTIMIZATION_SUMMARY.md
2. Review test files for usage examples
3. Check Sentry for production errors
4. Review RTK Query documentation for API patterns
