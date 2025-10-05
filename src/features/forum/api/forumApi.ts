import { createApi } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/core/infrastructure/supabase/client';
import { Post, Category, Comment, CreatePostData, CreateCommentData } from '../domain/Forum.types';
import { ForumMapper } from '../infrastructure/ForumMapper';

const supabaseBaseQuery = async ({ method, table, query, data }: {
  method: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  table?: string;
  query?: Record<string, unknown>;
  data?: unknown;
}) => {
  try {
    let result;

    if (method === 'select' && table) {
      const queryBuilder = supabase.from(table).select(query?.select as string || '*');
      
      if (query?.eq) {
        Object.entries(query.eq as Record<string, unknown>).forEach(([key, value]) => {
          queryBuilder.eq(key, value);
        });
      }
      
      if (query?.limit) queryBuilder.limit(query.limit as number);
      if (query?.offset) queryBuilder.range(query.offset as number, (query.offset as number) + (query.limit as number) - 1);
      
      result = await queryBuilder;
    } else if (method === 'insert' && table) {
      result = await supabase.from(table).insert(data).select().single();
    } else if (method === 'update' && table && query?.id) {
      result = await supabase.from(table).update(data).eq('id', query.id).select().single();
    } else if (method === 'delete' && table && query?.id) {
      result = await supabase.from(table).delete().eq('id', query.id);
    } else if (method === 'rpc' && table) {
      result = await supabase.rpc(table, data as Record<string, unknown>);
    }

    if (result?.error) {
      return { error: { status: 'CUSTOM_ERROR', error: result.error.message } };
    }

    return { data: result?.data };
  } catch (error) {
    return { error: { status: 'FETCH_ERROR', error: String(error) } };
  }
};

export const forumApi = createApi({
  reducerPath: 'forumApi',
  baseQuery: supabaseBaseQuery,
  tagTypes: ['Post', 'Category', 'Comment'],
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], { categoryId?: string; limit?: number; offset?: number }>({
      query: ({ categoryId, limit = 20, offset = 0 }) => ({
        method: 'select',
        table: 'posts',
        query: {
          select: '*, categories(*), app_users(*)',
          ...(categoryId && { eq: { category_id: categoryId } }),
          limit,
          offset,
        },
      }),
      transformResponse: (response: unknown[]) => response.map(ForumMapper.toPost),
      providesTags: ['Post'],
    }),

    getPostById: builder.query<Post, string>({
      query: (id) => ({
        method: 'select',
        table: 'posts',
        query: {
          select: '*, categories(*), app_users(*)',
          eq: { id },
        },
      }),
      transformResponse: (response: unknown[]) => response[0] ? ForumMapper.toPost(response[0]) : null,
      providesTags: (result, error, id) => [{ type: 'Post', id }],
    }),

    createPost: builder.mutation<Post, { userId: string; data: CreatePostData }>({
      query: ({ userId, data }) => ({
        method: 'insert',
        table: 'posts',
        data: { ...data, user_id: userId },
      }),
      transformResponse: (response: unknown) => ForumMapper.toPost(response),
      invalidatesTags: ['Post'],
    }),

    getCategories: builder.query<Category[], void>({
      query: () => ({
        method: 'select',
        table: 'categories',
        query: { select: '*' },
      }),
      transformResponse: (response: unknown[]) => response.map(ForumMapper.toCategory),
      providesTags: ['Category'],
    }),

    getComments: builder.query<Comment[], string>({
      query: (postId) => ({
        method: 'select',
        table: 'comments',
        query: {
          select: '*, app_users(*)',
          eq: { post_id: postId },
        },
      }),
      transformResponse: (response: unknown[]) => response.map(ForumMapper.toComment),
      providesTags: (result, error, postId) => [{ type: 'Comment', id: postId }],
    }),

    createComment: builder.mutation<Comment, { userId: string; data: CreateCommentData }>({
      query: ({ userId, data }) => ({
        method: 'insert',
        table: 'comments',
        data: { ...data, user_id: userId },
      }),
      transformResponse: (response: unknown) => ForumMapper.toComment(response),
      invalidatesTags: (result, error, { data }) => [{ type: 'Comment', id: data.postId }],
    }),
  }),
});

export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useCreatePostMutation,
  useGetCategoriesQuery,
  useGetCommentsQuery,
  useCreateCommentMutation,
} = forumApi;
