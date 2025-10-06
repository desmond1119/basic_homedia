import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
import {
  ForumPost,
  ForumComment,
  fetchForumFeedThunk,
  postArticleThunk,
  editPostThunk,
  deletePostThunk,
  upvoteThunk,
  downvoteThunk,
  reportPostThunk,
  fetchCommentsThunk,
  createCommentThunk,
} from '../infrastructure/ForumThunks';

interface ForumState {
  posts: ForumPost[];
  comments: Record<string, ForumComment[]>;
  currentPost: ForumPost | null;
  loading: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  error: string | null;
  filters: {
    category?: string;
    search?: string;
    sortBy: 'hot' | 'new' | 'top';
  };
}

const initialState: ForumState = {
  posts: [],
  comments: {},
  currentPost: null,
  loading: false,
  hasMore: true,
  total: 0,
  page: 1,
  error: null,
  filters: {
    sortBy: 'new',
  },
};

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ForumState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
      state.posts = [];
    },
    setCurrentPost: (state, action: PayloadAction<ForumPost | null>) => {
      state.currentPost = action.payload;
    },
    updatePostLocally: (state, action: PayloadAction<ForumPost>) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
      if (state.currentPost?.id === action.payload.id) {
        state.currentPost = action.payload;
      }
    },
    addCommentLocally: (state, action: PayloadAction<{ postId: string; comment: ForumComment }>) => {
      const { postId, comment } = action.payload;
      if (!state.comments[postId]) {
        state.comments[postId] = [];
      }
      
      if (comment.parent_id) {
        const addReply = (comments: ForumComment[]): boolean => {
          for (const c of comments) {
            if (c.id === comment.parent_id) {
              c.replies = c.replies || [];
              c.replies.push(comment);
              return true;
            }
            if (c.replies && addReply(c.replies)) {
              return true;
            }
          }
          return false;
        };
        addReply(state.comments[postId]);
      } else {
        state.comments[postId].push(comment);
      }

      // Update comment count
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.comment_count++;
      }
      if (state.currentPost?.id === postId) {
        state.currentPost.comment_count++;
      }
    },
    updateVoteCount: (state, action: PayloadAction<{ 
      targetId: string; 
      targetType: 'post' | 'comment'; 
      voteType: 'upvote' | 'downvote';
      delta: number;
    }>) => {
      const { targetId, targetType, voteType, delta } = action.payload;
      
      if (targetType === 'post') {
        const post = state.posts.find(p => p.id === targetId);
        if (post) {
          if (voteType === 'upvote') {
            post.upvote_count += delta;
          } else {
            post.downvote_count += delta;
          }
          post.score = post.upvote_count - post.downvote_count;
        }
        if (state.currentPost?.id === targetId) {
          if (voteType === 'upvote') {
            state.currentPost.upvote_count += delta;
          } else {
            state.currentPost.downvote_count += delta;
          }
          state.currentPost.score = state.currentPost.upvote_count - state.currentPost.downvote_count;
        }
      } else {
        // Update comment vote count
        Object.values(state.comments).forEach(comments => {
          const updateComment = (commentList: ForumComment[]): boolean => {
            for (const comment of commentList) {
              if (comment.id === targetId) {
                if (voteType === 'upvote') {
                  comment.upvote_count += delta;
                } else {
                  comment.downvote_count += delta;
                }
                return true;
              }
              if (comment.replies && updateComment(comment.replies)) {
                return true;
              }
            }
            return false;
          };
          updateComment(comments);
        });
      }
    },
    resetForum: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch forum feed
      .addCase(fetchForumFeedThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchForumFeedThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isSuccess()) {
          const { posts, total } = action.payload.getValue();
          if (state.page === 1) {
            state.posts = posts;
          } else {
            state.posts = [...state.posts, ...posts];
          }
          state.total = total;
          state.hasMore = state.posts.length < total;
          state.page++;
        } else {
          state.error = action.payload.getError();
        }
      })
      .addCase(fetchForumFeedThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch posts';
      })
      // Create post
      .addCase(postArticleThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postArticleThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isSuccess()) {
          const post = action.payload.getValue();
          state.posts.unshift(post);
          state.total++;
        } else {
          state.error = action.payload.getError();
        }
      })
      .addCase(postArticleThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create post';
      })
      // Edit post
      .addCase(editPostThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const updatedPost = action.payload.getValue();
          const index = state.posts.findIndex(p => p.id === updatedPost.id);
          if (index !== -1) {
            state.posts[index] = { ...state.posts[index], ...updatedPost };
          }
          if (state.currentPost?.id === updatedPost.id) {
            state.currentPost = { ...state.currentPost, ...updatedPost };
          }
        }
      })
      // Delete post
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const postId = action.meta.arg;
          state.posts = state.posts.filter(p => p.id !== postId);
          if (state.currentPost?.id === postId) {
            state.currentPost = null;
          }
          state.total--;
        }
      })
      // Upvote
      .addCase(upvoteThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const { targetId, targetType } = action.meta.arg;
          forumSlice.caseReducers.updateVoteCount(state, {
            type: 'updateVoteCount',
            payload: { targetId, targetType, voteType: 'upvote', delta: 1 },
          });
        }
      })
      // Downvote
      .addCase(downvoteThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const { targetId, targetType } = action.meta.arg;
          forumSlice.caseReducers.updateVoteCount(state, {
            type: 'updateVoteCount',
            payload: { targetId, targetType, voteType: 'downvote', delta: 1 },
          });
        }
      })
      // Fetch comments
      .addCase(fetchCommentsThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCommentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isSuccess()) {
          const postId = action.meta.arg;
          state.comments[postId] = action.payload.getValue();
        }
      })
      // Create comment
      .addCase(createCommentThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const { postId } = action.meta.arg;
          const comment = action.payload.getValue();
          forumSlice.caseReducers.addCommentLocally(state, {
            type: 'addCommentLocally',
            payload: { postId, comment },
          });
        }
      });
  },
});

export const {
  setFilters,
  setCurrentPost,
  updatePostLocally,
  addCommentLocally,
  updateVoteCount,
  resetForum,
} = forumSlice.actions;

export default forumSlice.reducer;

// Realtime subscription setup
export const setupForumRealtimeSubscription = () => (dispatch: any): (() => void) => {
  const channel = supabase
    .channel('forum_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'forum_posts' },
      (payload) => {
        dispatch(updatePostLocally(payload.new as ForumPost));
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'forum_posts' },
      (payload) => {
        dispatch(updatePostLocally(payload.new as ForumPost));
      }
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'forum_comments' },
      (payload) => {
        const comment = payload.new as ForumComment;
        dispatch(addCommentLocally({ postId: comment.post_id, comment }));
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
