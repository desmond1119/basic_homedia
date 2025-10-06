import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/core/infrastructure/supabase/client';

interface Post {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  tags: string[];
  media_urls: string[];
  like_count: number;
  comment_count: number;
  repost_count: number;
  bookmark_count: number;
  view_count: number;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  media_urls: string[];
  like_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatePostParams {
  userId: string;
  categoryId: string | null;
  title: string;
  content: string;
  tags?: string[];
  mediaUrls?: string[];
}

interface CreateCommentParams {
  postId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  mediaUrls?: string[];
}

interface FetchPostsParams {
  limit?: number;
  offset?: number;
  categoryId?: string;
}

export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Post', 'Comment'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], FetchPostsParams>({
      queryFn: async ({ limit = 20, offset = 0, categoryId }) => {
        try {
          let query = supabase
            .from('posts')
            .select('*')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (categoryId) {
            query = query.eq('category_id', categoryId);
          }

          const { data, error } = await query;

          if (error) throw error;

          return { data: data as Post[] };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Post' as const, id })), { type: 'Post', id: 'LIST' }]
          : [{ type: 'Post', id: 'LIST' }],
    }),

    getPostById: builder.query<Post, string>({
      queryFn: async (postId) => {
        try {
          const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', postId)
            .eq('is_deleted', false)
            .single();

          if (error) throw error;

          return { data: data as Post };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    createPost: builder.mutation<Post, CreatePostParams>({
      queryFn: async (params) => {
        try {
          const { data, error } = await supabase
            .from('posts')
            .insert({
              user_id: params.userId,
              category_id: params.categoryId,
              title: params.title,
              content: params.content,
              tags: params.tags || [],
              media_urls: params.mediaUrls || [],
            })
            .select()
            .single();

          if (error) throw error;

          return { data: data as Post };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: [{ type: 'Post', id: 'LIST' }],
    }),

    getComments: builder.query<Comment[], string>({
      queryFn: async (postId) => {
        try {
          const { data, error } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });

          if (error) throw error;

          return { data: data as Comment[] };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, postId) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Comment' as const, id })), { type: 'Comment', id: postId }]
          : [{ type: 'Comment', id: postId }],
    }),

    createComment: builder.mutation<Comment, CreateCommentParams>({
      queryFn: async (params) => {
        try {
          const { data, error } = await supabase
            .from('comments')
            .insert({
              post_id: params.postId,
              user_id: params.userId,
              parent_id: params.parentId || null,
              content: params.content,
              media_urls: params.mediaUrls || [],
            })
            .select()
            .single();

          if (error) throw error;

          return { data: data as Comment };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { postId }) => [
        { type: 'Comment', id: postId },
        { type: 'Post', id: postId },
      ],
    }),

    toggleLike: builder.mutation<void, { userId: string; targetId: string; targetType: 'post' | 'comment' }>({
      queryFn: async ({ userId, targetId, targetType }) => {
        try {
          const { data: existing } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('target_id', targetId)
            .eq('target_type', targetType)
            .single();

          if (existing) {
            const { error } = await supabase
              .from('likes')
              .delete()
              .eq('user_id', userId)
              .eq('target_id', targetId)
              .eq('target_type', targetType);

            if (error) throw error;
          } else {
            const { error } = await supabase.from('likes').insert({
              user_id: userId,
              target_id: targetId,
              target_type: targetType,
            });

            if (error) throw error;
          }

          return { data: undefined };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { targetId, targetType }) => [
        { type: targetType === 'post' ? 'Post' : 'Comment', id: targetId },
      ],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useToggleLikeMutation,
} = forumApi;
