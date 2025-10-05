/**
 * Forum Slice
 * Redux state management for forum
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ForumRepository } from '../infrastructure/ForumRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Result } from '@/core/domain/base/Result';
import {
  Category,
  Post,
  Comment,
  CreatePostData,
  CreateCommentData,
  UpdatePostData,
  CreateCategoryData,
} from '../domain/Forum.types';

interface ForumState {
  categories: Category[];
  posts: Post[];
  selectedPost: Post | null;
  comments: Comment[];
  currentCategoryId: string | null;
  hasMore: boolean;
  fetchCategories: AsyncState;
  fetchPosts: AsyncState;
  fetchPost: AsyncState;
  createPost: AsyncState;
  updatePost: AsyncState;
  deletePost: AsyncState;
  fetchComments: AsyncState;
  createComment: AsyncState;
  likeAction: AsyncState;
  bookmarkAction: AsyncState;
  repostAction: AsyncState;
}

const initialState: ForumState = {
  categories: [],
  posts: [],
  selectedPost: null,
  comments: [],
  currentCategoryId: null,
  hasMore: true,
  fetchCategories: initialAsyncState,
  fetchPosts: initialAsyncState,
  fetchPost: initialAsyncState,
  createPost: initialAsyncState,
  updatePost: initialAsyncState,
  deletePost: initialAsyncState,
  fetchComments: initialAsyncState,
  createComment: initialAsyncState,
  likeAction: initialAsyncState,
  bookmarkAction: initialAsyncState,
  repostAction: initialAsyncState,
};

const forumRepository = new ForumRepository();

// Async Thunks
export const fetchCategories = createAsyncThunkWithError<Category[], void>(
  'forum/fetchCategories',
  async () => {
    return await forumRepository.getCategories();
  }
);

export const createCategory = createAsyncThunkWithError<Category, CreateCategoryData>(
  'forum/createCategory',
  async (data) => {
    return await forumRepository.createCategory(data);
  }
);

export const fetchPosts = createAsyncThunkWithError<
  Post[],
  { categoryId?: string; limit?: number; offset?: number }
>(
  'forum/fetchPosts',
  async ({ categoryId, limit = 20, offset = 0 }) => {
    return await forumRepository.getPosts(categoryId, limit, offset);
  }
);

export const fetchPostById = createAsyncThunkWithError<Post | null, string>(
  'forum/fetchPostById',
  async (postId) => {
    return await forumRepository.getPostById(postId);
  }
);

export const createPost = createAsyncThunkWithError<
  Post,
  { userId: string; data: CreatePostData }
>(
  'forum/createPost',
  async ({ userId, data }) => {
    return await forumRepository.createPost(userId, data);
  }
);

export const updatePost = createAsyncThunkWithError<
  Post,
  { postId: string; data: UpdatePostData }
>(
  'forum/updatePost',
  async ({ postId, data }) => {
    return await forumRepository.updatePost(postId, data);
  }
);

export const deletePost = createAsyncThunkWithError<boolean, string>(
  'forum/deletePost',
  async (postId) => {
    return await forumRepository.deletePost(postId);
  }
);

export const fetchComments = createAsyncThunkWithError<Comment[], string>(
  'forum/fetchComments',
  async (postId) => {
    return await forumRepository.getCommentsByPostId(postId);
  }
);

export const createComment = createAsyncThunkWithError<
  Comment,
  { userId: string; data: CreateCommentData }
>(
  'forum/createComment',
  async ({ userId, data }) => {
    return await forumRepository.createComment(userId, data);
  }
);

export const toggleLike = createAsyncThunkWithError<
  { isLiked: boolean },
  { userId: string; targetId: string; targetType: 'post' | 'comment'; currentlyLiked: boolean }
>(
  'forum/toggleLike',
  async ({ userId, targetId, targetType, currentlyLiked }) => {
    const actionResult = currentlyLiked
      ? await forumRepository.unlikeTarget(userId, targetId, targetType)
      : await forumRepository.likeTarget(userId, targetId, targetType);

    if (actionResult.isFailure()) {
      return Result.fail(actionResult.getError());
    }

    return Result.ok({ isLiked: !currentlyLiked });
  }
);

export const toggleBookmark = createAsyncThunkWithError<
  { isBookmarked: boolean },
  { userId: string; postId: string; currentlyBookmarked: boolean }
>(
  'forum/toggleBookmark',
  async ({ userId, postId, currentlyBookmarked }) => {
    const actionResult = currentlyBookmarked
      ? await forumRepository.unbookmarkPost(userId, postId)
      : await forumRepository.bookmarkPost(userId, postId);

    if (actionResult.isFailure()) {
      return Result.fail(actionResult.getError());
    }

    return Result.ok({ isBookmarked: !currentlyBookmarked });
  }
);

export const toggleRepost = createAsyncThunkWithError<
  { isReposted: boolean },
  { userId: string; postId: string; currentlyReposted: boolean; comment?: string }
>(
  'forum/toggleRepost',
  async ({ userId, postId, currentlyReposted, comment }) => {
    const actionResult = currentlyReposted
      ? await forumRepository.unrepostPost(userId, postId)
      : await forumRepository.repostPost(userId, postId, comment);

    if (actionResult.isFailure()) {
      return Result.fail(actionResult.getError());
    }

    return Result.ok({ isReposted: !currentlyReposted });
  }
);

export const uploadMedia = createAsyncThunkWithError<
  string,
  { file: File; userId: string }
>(
  'forum/uploadMedia',
  async ({ file, userId }) => {
    return await forumRepository.uploadMedia(file, userId);
  }
);

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    setCurrentCategory: (state, action: PayloadAction<string | null>) => {
      state.currentCategoryId = action.payload;
      state.posts = [];
      state.hasMore = true;
    },
    clearSelectedPost: (state) => {
      state.selectedPost = null;
      state.comments = [];
    },
    resetPosts: (state) => {
      state.posts = [];
      state.hasMore = true;
    },
  },
  extraReducers: (builder) => {
    // Fetch Categories
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
        state.fetchCategories.error = action.payload?.message ?? 'Failed to fetch categories';
      });

    // Create Category
    builder
      .addCase(createCategory.fulfilled, (state, action) => {
        state.categories.push(action.payload);
      });

    // Fetch Posts
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
        state.fetchPosts.error = action.payload?.message ?? 'Failed to fetch posts';
      });

    // Fetch Post By ID
    builder
      .addCase(fetchPostById.pending, (state) => {
        state.fetchPost.status = 'pending';
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.fetchPost.status = 'succeeded';
        state.selectedPost = action.payload;
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.fetchPost.status = 'failed';
        state.fetchPost.error = action.payload?.message ?? 'Failed to fetch post';
      });

    // Create Post
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
        state.createPost.error = action.payload?.message ?? 'Failed to create post';
      });

    // Update Post
    builder
      .addCase(updatePost.fulfilled, (state, action) => {
        const index = state.posts.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.posts[index] = action.payload;
        }
        if (state.selectedPost?.id === action.payload.id) {
          state.selectedPost = action.payload;
        }
      });

    // Delete Post
    builder
      .addCase(deletePost.fulfilled, (state, action) => {
        state.posts = state.posts.filter((p) => p.id !== action.meta.arg);
      });

    // Fetch Comments
    builder
      .addCase(fetchComments.pending, (state) => {
        state.fetchComments.status = 'pending';
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.fetchComments.status = 'succeeded';
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.fetchComments.status = 'failed';
        state.fetchComments.error = action.payload?.message ?? 'Failed to fetch comments';
      });

    // Create Comment
    builder
      .addCase(createComment.fulfilled, (state, action) => {
        if (action.payload.parentId) {
          // Handle nested comment
          const findAndAddReply = (comments: Comment[]): boolean => {
            for (const comment of comments) {
              if (comment.id === action.payload.parentId) {
                if (!comment.replies) comment.replies = [];
                comment.replies.push(action.payload);
                return true;
              }
              if (comment.replies && findAndAddReply(comment.replies)) {
                return true;
              }
            }
            return false;
          };
          findAndAddReply(state.comments);
        } else {
          state.comments.push(action.payload);
        }
        
        // Update comment count
        if (state.selectedPost) {
          state.selectedPost.commentCount += 1;
        }
      });
  },
});

export const { setCurrentCategory, clearSelectedPost, resetPosts } = forumSlice.actions;
export const forumReducer = forumSlice.reducer;
