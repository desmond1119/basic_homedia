# RTK Query Migration Guide

## Overview
Migrate `forumSlice` from manual async thunks to RTK Query for reduced boilerplate and improved caching.

## Steps

### 1. Create API Slice

```typescript
// src/features/forum/store/forumApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/core/infrastructure/supabase/client';

export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.VITE_SUPABASE_URL!,
    prepareHeaders: async (headers) => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers.set('Authorization', `Bearer ${data.session.access_token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['ForumPost', 'ForumThread', 'Comment'],
  endpoints: (builder) => ({
    getForumPosts: builder.query({
      query: ({ filters, limit, offset }) => ({
        url: '/rest/v1/forum_posts',
        params: { limit, offset, ...filters },
      }),
      providesTags: ['ForumPost'],
    }),
    getForumThread: builder.query({
      query: (threadId) => `/rest/v1/forum_threads?id=eq.${threadId}`,
      providesTags: (result, error, id) => [{ type: 'ForumThread', id }],
    }),
    createForumPost: builder.mutation({
      query: (post) => ({
        url: '/rest/v1/forum_posts',
        method: 'POST',
        body: post,
      }),
      invalidatesTags: ['ForumPost'],
    }),
    updateForumPost: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/rest/v1/forum_posts?id=eq.${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'ForumPost', id },
      ],
    }),
    deleteForumPost: builder.mutation({
      query: (id) => ({
        url: `/rest/v1/forum_posts?id=eq.${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ForumPost'],
    }),
  }),
});

export const {
  useGetForumPostsQuery,
  useGetForumThreadQuery,
  useCreateForumPostMutation,
  useUpdateForumPostMutation,
  useDeleteForumPostMutation,
} = forumApi;
```

### 2. Update Store Configuration

```typescript
// src/core/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { forumApi } from '@/features/forum/store/forumApi';

export const store = configureStore({
  reducer: {
    // ... other reducers
    [forumApi.reducerPath]: forumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(forumApi.middleware),
});
```

### 3. Update Components

**Before:**
```typescript
const { posts, fetchPosts } = useAppSelector((state) => state.forum);
const dispatch = useAppDispatch();

useEffect(() => {
  dispatch(fetchForumPosts({ limit: 20, offset: 0 }));
}, [dispatch]);

if (fetchPosts.status === 'pending') return <Loading />;
```

**After:**
```typescript
const { data: posts, isLoading, error } = useGetForumPostsQuery({ 
  limit: 20, 
  offset: 0 
});

if (isLoading) return <Loading />;
if (error) return <Error />;
```

### 4. Optimistic Updates

```typescript
const [updatePost] = useUpdateForumPostMutation();

const handleLike = async (postId: string) => {
  try {
    await updatePost({
      id: postId,
      likes: post.likes + 1,
    }).unwrap();
  } catch (error) {
    // Error handled by RTK Query
  }
};
```

## Benefits

- ✅ **50% less boilerplate** - No manual thunks, loading states
- ✅ **Automatic caching** - Deduplicated requests
- ✅ **Optimistic updates** - Built-in support
- ✅ **Type-safe** - Auto-generated hooks with TypeScript
- ✅ **Normalized cache** - Better performance

## Testing

```typescript
// __tests__/forumApi.test.ts
import { forumApi } from '../forumApi';
import { setupApiStore } from '@/test/utils';

describe('forumApi', () => {
  it('fetches forum posts', async () => {
    const storeRef = setupApiStore(forumApi);
    await storeRef.store.dispatch(
      forumApi.endpoints.getForumPosts.initiate({ limit: 10, offset: 0 })
    );
    
    const state = storeRef.store.getState();
    expect(forumApi.endpoints.getForumPosts.select({ limit: 10, offset: 0 })(state))
      .toMatchObject({ isSuccess: true });
  });
});
```

## Migration Checklist

- [ ] Create `forumApi.ts` with all endpoints
- [ ] Add `forumApi` to store configuration
- [ ] Update all components using forum state
- [ ] Remove old `forumSlice.ts` thunks
- [ ] Add tests for RTK Query endpoints
- [ ] Update documentation
- [ ] Verify all features work correctly
