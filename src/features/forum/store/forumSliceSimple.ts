import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ForumRepositorySimple } from '../infrastructure/ForumRepositorySimple';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Category, Post, CreatePostData } from '../domain/Forum.types';

interface ForumState {
  categories: Category[];
  posts: Post[];
  currentCategoryId: string | null;
  hasMore: boolean;
  fetchCategories: AsyncState;
  fetchPosts: AsyncState;
  createPost: AsyncState;
}

const initialState: ForumState = {
  categories: [],
  posts: [],
  currentCategoryId: null,
  hasMore: true,
  fetchCategories: initialAsyncState,
  fetchPosts: initialAsyncState,
  createPost: initialAsyncState,
};

const repository = new ForumRepositorySimple();

export const fetchCategories = createAsyncThunk<Category[], void>(
  'forum/fetchCategories',
  async () => await repository.getCategories()
);

export const fetchPosts = createAsyncThunk<
  Post[],
  { categoryId?: string; limit?: number; offset?: number }
>(
  'forum/fetchPosts',
  async ({ categoryId, limit = 20, offset = 0 }) =>
    await repository.getPosts(categoryId, limit, offset)
);

export const createPost = createAsyncThunk<
  Post,
  { userId: string; data: CreatePostData }
>(
  'forum/createPost',
  async ({ userId, data }) => await repository.createPost(userId, data)
);

export const uploadMedia = createAsyncThunk<
  string,
  { file: File; userId: string }
>(
  'forum/uploadMedia',
  async ({ file, userId }) => await repository.uploadMedia(file, userId)
);

const forumSliceSimple = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    setCurrentCategory: (state, action: PayloadAction<string | null>) => {
      state.currentCategoryId = action.payload;
      state.posts = [];
      state.hasMore = true;
    },
    resetPosts: (state) => {
      state.posts = [];
      state.hasMore = true;
    },
    addNewPostRealtime: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.fetchCategories.status = 'pending';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.fetchCategories.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.fetchCategories.status = 'failed';
        state.fetchCategories.error = action.error.message ?? 'Failed to fetch categories';
      });

    builder
      .addCase(fetchPosts.pending, (state) => {
        state.fetchPosts.status = 'pending';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.fetchPosts.status = 'succeeded';
        if (action.meta.arg.offset === 0) {
          state.posts = action.payload;
        } else {
          state.posts.push(...action.payload);
        }
        state.hasMore = action.payload.length === (action.meta.arg.limit || 20);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.fetchPosts.status = 'failed';
        state.fetchPosts.error = action.error.message ?? 'Failed to fetch posts';
      });

    builder
      .addCase(createPost.pending, (state) => {
        state.createPost.status = 'pending';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.createPost.status = 'succeeded';
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.createPost.status = 'failed';
        state.createPost.error = action.error.message ?? 'Failed to create post';
      });
  },
});

export const { setCurrentCategory, resetPosts, addNewPostRealtime } = forumSliceSimple.actions;
export const forumSimpleReducer = forumSliceSimple.reducer;
