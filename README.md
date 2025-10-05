# 🏗️ Renovation Platform

> Enterprise-grade React platform for renovation services - connecting homeowners with service providers through a modern, scalable architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Overview

A production-ready renovation platform featuring:
- 🌐 **Multi-language Support** (繁體中文, English, 简体中文)
- 🎨 **Mobbin-Inspired UI** (Dark theme, modern animations)
- 💬 **Real-time Forum** (Posts, comments, likes with live updates)
- 🔐 **Enterprise Auth** (Role-based access control)
- 📱 **Mobile-First** (Responsive design, progressive enhancement)

## 🚀 Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework |
| **TypeScript** | 5.5 | Type safety (strict mode) |
| **Vite** | 5.4 | Build tool & dev server |
| **Redux Toolkit** | 2.9 | State management |
| **TailwindCSS** | 3.4 | Utility-first styling |
| **Framer Motion** | 10.x | Animations & micro-interactions |
| **React Router** | 6.x | Client-side routing |
| **react-i18next** | 13.x | Internationalization |

### Backend
| Service | Purpose |
|---------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Relational database |
| **Auth** | Authentication & authorization |
| **Storage** | File uploads (images/videos) |
| **Realtime** | Live updates & subscriptions |
| **RLS** | Row-level security |

### DevOps & Quality
- **Vitest** - Unit & integration testing
- **ESLint** - Code linting
- **GitHub Actions** - CI/CD pipeline
- **Vercel** - Production deployment

---

## 📁 Project Structure

```
renovation-platform/
├── src/
│   ├── core/                      # Core infrastructure
│   │   ├── domain/base/          # Base patterns (Result, Entity)
│   │   ├── infrastructure/       # External services
│   │   │   └── supabase/        # Supabase client
│   │   └── store/               # Redux configuration
│   │
│   ├── features/                 # Feature modules
│   │   ├── auth/                # Authentication system
│   │   │   ├── domain/          # Types & interfaces
│   │   │   ├── infrastructure/  # AuthRepository, AuthMapper
│   │   │   ├── store/           # authSlice
│   │   │   └── components/      # Login, Register, Dashboard
│   │   │
│   │   └── forum/               # Discussion forum
│   │       ├── domain/          # Post, Comment types
│   │       ├── infrastructure/  # ForumRepository, mappers
│   │       ├── store/           # forumSlice, messageSlice
│   │       └── components/      # ForumPage, PostCard, etc.
│   │
│   ├── shared/                   # Shared resources
│   │   └── components/          # Reusable UI components
│   │       ├── MobbinCard.tsx
│   │       ├── FlowViewer.tsx
│   │       └── LanguageSwitcher.tsx
│   │
│   ├── i18n/                     # Internationalization
│   │   └── index.ts             # i18next configuration
│   │
│   ├── locales/                  # Translation files
│   │   ├── zh-TW.json           # Traditional Chinese (default)
│   │   ├── en.json              # English
│   │   └── zh-CN.json           # Simplified Chinese
│   │
│   └── App.tsx                   # Root component
│
├── supabase/migrations/          # Database migrations
│   ├── 001_create_users_table.sql
│   ├── 002_auth_system.sql
│   └── 003_forum_system.sql
│
├── docs/                         # Documentation
│   ├── AUTH_SETUP_GUIDE.md
│   ├── FORUM_SETUP_GUIDE.md
│   └── I18N_GUIDE.md
│
└── tailwind.config.js            # Tailwind + dark theme config
```

---

## 🏛️ Architecture

### Layered Design

```
┌──────────────────────────────────────────────────┐
│              UI Layer (React)                    │
│  Components, Pages, Mobbin-style Design         │
├──────────────────────────────────────────────────┤
│         State Management (Redux)                 │
│  Slices, Thunks, Async Actions                  │
├──────────────────────────────────────────────────┤
│          Business Logic Layer                    │
│  Repository Pattern, Validation Rules           │
├──────────────────────────────────────────────────┤
│           Data Mapping Layer                     │
│  Mappers (Domain ↔ Persistence)                 │
├──────────────────────────────────────────────────┤
│         Infrastructure Layer                     │
│  Supabase Client, External APIs                 │
└──────────────────────────────────────────────────┘
```

### Key Patterns

**1. Repository Pattern**
```typescript
// Centralized data access
export class ForumRepository {
  async getPosts(categoryId?: string): Promise<Result<Post[], Error>> {
    const { data, error } = await supabase
      .from('posts_with_user')
      .select('*')
      .eq('category_id', categoryId);
    
    if (error) return Result.fail(new Error(error.message));
    return Result.ok(data.map(ForumMapper.toPost));
  }
}
```

**2. Mapper Pattern**
```typescript
// Transform database models to domain models
export class ForumMapper {
  static toPost(row: PostRow): Post {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      createdAt: new Date(row.created_at),
      // ... domain model
    };
  }
}
```

**3. Result Pattern**
```typescript
// Type-safe error handling
const result = await repository.getUser(id);

if (result.isSuccess()) {
  const user = result.getValue();
  // Use user
} else {
  const error = result.getError();
  // Handle error
}
```

**4. Redux Thunks**
```typescript
// Async actions with type safety
export const fetchPosts = createAsyncThunkWithError<Post[], { categoryId?: string }>(
  'forum/fetchPosts',
  async ({ categoryId }) => {
    return await forumRepository.getPosts(categoryId);
  }
);
```

---

## 🎨 Design System

### Mobbin-Inspired UI

**Theme:** Black/White/Gray palette for modern, professional look

```css
/* Color Palette */
Background: #000000 (black)
Deep Text: #FFFFFF (white) - Primary content
Shallow Text: #6B7280 (gray-500) - Secondary content
Cards: #1F2937 (gray-800) - Elevated surfaces
Borders: #374151 (gray-700)
```

**Component Classes:**
```tsx
.mobbin-card      // Card with hover scale effect
.glass-card       // Glassmorphism with backdrop blur
.btn-primary      // White bg, black text
.btn-secondary    // Dark bg with border
.input-field      // Dark input with focus ring
.text-deep        // Primary text (white)
.text-shallow     // Secondary text (gray-500)
```

**Animations (Framer Motion):**
```tsx
// Entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>

// Hover interaction
<motion.div
  whileHover={{ scale: 1.05, y: -5 }}
  whileTap={{ scale: 0.98 }}
>
  Interactive Card
</motion.div>
```

### Typography
- **Font Family:** Inter (Google Fonts)
- **Headings:** font-semibold, text-white
- **Body:** font-normal, text-gray-200
- **Secondary:** text-gray-500

---

## 🌐 Internationalization (i18n)

### Configuration
- **Default Language:** 繁體中文 (zh-TW)
- **Supported:** English (en), 简体中文 (zh-CN)
- **Library:** react-i18next with localStorage persistence

### Usage
```typescript
import { useTranslation } from 'react-i18next';

export const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('forum.title')}</h1>
      <button>{t('common.submit')}</button>
      <p>{t('forum.post.mediaSelected', { count: 5 })}</p>
    </div>
  );
};
```

### Translation Structure
```json
{
  "common": { "loading": "載入中...", "submit": "提交" },
  "auth": {
    "login": { "title": "登入您的帳戶", "email": "電子郵件" }
  },
  "forum": {
    "title": "社群論壇",
    "post": { "create": "建立貼文" }
  }
}
```

**Rule:** All user-visible text MUST use `t('key')` - no hard-coded strings.

---

## 🔐 Security

### Row-Level Security (RLS)
All tables protected with PostgreSQL RLS policies:

```sql
-- Users can only read/update own data
CREATE POLICY "Users can view own profile"
  ON app_users FOR SELECT
  USING (auth.uid() = id);

-- Admin override
CREATE POLICY "Admins can view all users"
  ON app_users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM app_users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Authentication Flow
1. User registers via `AuthRepository.register()`
2. Supabase creates auth user + session
3. `app_users` row inserted with profile data
4. JWT stored in localStorage
5. Protected routes check `isAuthenticated` from Redux

### Environment Variables
```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...  # Public anon key (safe)

# Never commit:
# - Service role key
# - Database password
# - API secrets
```

---

## ⚡ Performance & Scalability

### Database Optimizations
- **Indexes** on frequently queried columns (user_id, created_at, category_id)
- **Views** for complex joins (`posts_with_user`, `comments_with_user`)
- **Triggers** for automatic count updates (like_count, comment_count)
- **Pagination** with offset/limit (20 posts per page)

### Frontend Optimizations
- **Code Splitting:** React.lazy() for routes
- **Infinite Scroll:** Load posts incrementally
- **Memoization:** React.memo for expensive components
- **Debouncing:** Search inputs with 300ms delay
- **Image Optimization:** Lazy loading with Intersection Observer

### Caching Strategy
```typescript
// Redux caching
const cachedPosts = useAppSelector((state) => state.forum.posts);
if (cachedPosts.length > 0) return; // Skip fetch

// Supabase caching
supabase.from('posts').select('*').cache(60); // 60s cache
```

### Realtime Subscriptions
```typescript
// Live updates for new posts
supabase
  .channel('posts')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'posts' },
    (payload) => dispatch(addPost(payload.new))
  )
  .subscribe();
```

---

## 🧪 Testing

### Unit Tests (Vitest)
```typescript
// tests/features/auth/AuthRepository.test.ts
import { describe, it, expect } from 'vitest';
import { AuthRepository } from '@/features/auth/infrastructure/AuthRepository';

describe('AuthRepository', () => {
  it('should register user successfully', async () => {
    const result = await authRepository.register({
      email: 'test@example.com',
      password: 'Test123456',
      username: 'testuser',
    });
    
    expect(result.isSuccess()).toBe(true);
  });
});
```

### Component Tests
```typescript
import { render, screen } from '@testing-library/react';
import { LoginPage } from './LoginPage';

test('renders login form', () => {
  render(<LoginPage />);
  expect(screen.getByText(/登入您的帳戶/i)).toBeInTheDocument();
});
```

### Run Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- Git

### Quick Start

**1. Clone & Install**
```bash
git clone <repo-url>
cd renovation-platform
npm install
```

**2. Environment Setup**
```bash
cp .env.example .env
```

Edit `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**3. Database Setup**
Execute migrations in Supabase SQL Editor:
```bash
# 1. supabase/migrations/001_create_users_table.sql
# 2. supabase/migrations/002_auth_system.sql
# 3. supabase/migrations/003_forum_system.sql
```

**4. Storage Setup**
Create bucket in Supabase Dashboard:
- Name: `forum-media`
- Public: Yes
- File size limit: 50MB

**5. Start Development**
```bash
npm run dev
# Open http://localhost:5173
```

**6. Test Features**
- Register: `/register`
- Login: `/login`
- Forum: `/forum`
- Profile: `/profile/:userId`

---

## 📦 Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run type-check   # TypeScript check
npm test             # Run tests
```

---

## 🎯 Core Features

### 1. Authentication System
- **Multi-role:** Homeowner, Service Provider, Admin
- **Registration:** Username, email, password with validation
- **Login:** Email/password with session persistence
- **Protected Routes:** Redirect to login if unauthorized
- **Profile Management:** View/edit user details

**Files:**
- `src/features/auth/components/LoginPage.tsx`
- `src/features/auth/components/RegisterPage.tsx`
- `src/features/auth/store/authSlice.ts`
- `supabase/migrations/002_auth_system.sql`

### 2. Discussion Forum
- **Categories:** Admin-created topics (Renovation Q&A, Unboxing, etc.)
- **Posts:** Title, content, tags, image/video uploads
- **Comments:** Nested replies with threading
- **Interactions:** Like, bookmark, repost
- **Real-time:** Live updates for new posts/comments

**Files:**
- `src/features/forum/components/ForumPage.tsx`
- `src/features/forum/components/PostCard.tsx`
- `src/features/forum/store/forumSlice.ts`
- `supabase/migrations/003_forum_system.sql`

### 3. Private Messaging
- **Direct Messages:** User-to-user communication
- **Real-time:** Instant message delivery
- **Conversation View:** Chat-style interface

**Files:**
- `src/features/forum/components/MessageModal.tsx`
- `src/features/forum/store/messageSlice.ts`

### 4. User Profiles
- **Public Profiles:** Avatar, bio, stats (followers, posts)
- **Follow System:** Follow/unfollow users
- **Activity Feed:** User's posts and interactions

**Files:**
- `src/features/forum/components/ProfilePage.tsx`
- `src/features/forum/store/profileSlice.ts`

---

## 🎨 UI Component Library

### Mobbin-Style Components

**MobbinCard**
```tsx
<MobbinCard
  title="Renovation Q&A"
  description="Ask questions about your renovation"
  image="/images/qa.jpg"
  icon={<QuestionMarkCircleIcon />}
  onClick={() => navigate('/forum/qa')}
/>
```

**FlowViewer** (Interactive prototype viewer)
```tsx
<FlowViewer
  screens={[
    { id: 1, image: '/screen1.jpg', hotspots: [{ x: 50, y: 30, label: 'Login' }] },
    { id: 2, image: '/screen2.jpg', hotspots: [] }
  ]}
/>
```

**HeroSection** (Animated landing)
```tsx
<HeroSection />
```

**GridSection** (Pattern showcase)
```tsx
<GridSection
  title="Features"
  items={[
    { title: 'Forum', description: 'Discuss with community' },
    { title: 'Requests', description: 'Post renovation needs' }
  ]}
/>
```

---

## 🌍 Deployment

### Vercel (Recommended)

**1. Connect Repository**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**2. Environment Variables**
Add in Vercel Dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**3. Build Settings**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

### Alternative: Netlify, AWS Amplify
Similar process - import Git repo, add env vars, deploy.

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**`.github/workflows/ci.yml`**
```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm test
  
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📚 Documentation

- **[Auth Setup Guide](docs/AUTH_SETUP_GUIDE.md)** - Authentication system details
- **[Forum Setup Guide](docs/FORUM_SETUP_GUIDE.md)** - Forum configuration & testing
- **[i18n Guide](docs/I18N_GUIDE.md)** - Internationalization usage
- **[API Reference](docs/API.md)** - Supabase schema & functions

---

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
```bash
git checkout -b feature/new-feature
```

2. **Follow Coding Standards**
- TypeScript strict mode (no `any`)
- All text uses `t('key')` for i18n
- Mobbin-style UI (dark theme, animations)
- Repository pattern for data access
- Comments in English

3. **Test Your Changes**
```bash
npm run type-check
npm run lint
npm test
```

4. **Commit with Conventional Commits**
```bash
git commit -m "feat: add user profile editing"
git commit -m "fix: resolve login redirect issue"
```

5. **Submit Pull Request**
- Describe changes
- Link related issues
- Add screenshots for UI changes

### Code Style

**TypeScript:**
```typescript
// ✅ Good
interface UserProfile {
  id: string;
  username: string;
}

// ❌ Bad
const profile: any = { ... };
```

**i18n:**
```tsx
// ✅ Good
<h1>{t('forum.title')}</h1>

// ❌ Bad
<h1>Community Forum</h1>
```

**Components:**
```tsx
// ✅ Good - Mobbin style
<motion.div className="mobbin-card">
  <h3 className="text-deep">{title}</h3>
  <p className="text-shallow">{description}</p>
</motion.div>

// ❌ Bad - outdated style
<div style={{ backgroundColor: 'white', padding: '10px' }}>
  <h3>{title}</h3>
</div>
```

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Design Inspiration:** [Mobbin](https://mobbin.com/)
- **UI Framework:** React Team
- **Backend:** Supabase Team
- **Icons:** Heroicons
- **Animations:** Framer Motion

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email:** support@renovation-platform.com

---

**Built with ❤️ for the renovation community**
