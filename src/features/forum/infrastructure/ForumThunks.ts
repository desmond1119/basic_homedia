import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';

export interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  media_urls: string[];
  is_pinned: boolean;
  is_deleted: boolean;
  upvote_count: number;
  downvote_count: number;
  comment_count: number;
  report_count: number;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
  display_name?: string;
  score?: number;
}

export interface ForumComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  media_urls: string[];
  upvote_count: number;
  downvote_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  avatar_url?: string;
  display_name?: string;
  replies?: ForumComment[];
}

export interface ForumVote {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  vote_type: 'upvote' | 'downvote';
}

export interface ForumReport {
  id: string;
  reporter_id: string;
  post_id?: string;
  comment_id?: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

interface ForumFeedParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: 'hot' | 'new' | 'top';
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  tags: string[];
  media?: File[];
}

// Fetch forum feed with pagination and filters
export const fetchForumFeedThunk = createAsyncThunk(
  'forum/fetchFeed',
  async (params: ForumFeedParams = {}) => {
    try {
      const { page = 1, limit = 20, category, search, sortBy = 'new' } = params;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('forum_feed')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      switch (sortBy) {
        case 'hot':
          query = query.order('score', { ascending: false });
          break;
        case 'top':
          query = query.order('upvote_count', { ascending: false });
          break;
        default:
          query = query.order('is_pinned', { ascending: false })
                      .order('created_at', { ascending: false });
      }

      const { data, error, count } = await query;

      if (error) {
        return Result.fail<{ posts: ForumPost[]; total: number }>(error.message);
      }

      return Result.ok({ posts: data || [], total: count || 0 });
    } catch (error) {
      return Result.fail<{ posts: ForumPost[]; total: number }>('Failed to fetch forum feed');
    }
  }
);

// Create new post with media upload
export const postArticleThunk = createAsyncThunk(
  'forum/postArticle',
  async (formData: PostFormData) => {
    try {
      // Validate required fields
      if (!formData.title?.trim() || !formData.content?.trim()) {
        return Result.fail<ForumPost>('Title and content are required');
      }

      // Validate tags uniqueness
      const uniqueTags = [...new Set(formData.tags)];
      if (uniqueTags.length !== formData.tags.length) {
        return Result.fail<ForumPost>('Duplicate tags not allowed');
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumPost>('User not authenticated');
      }

      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (appUserError || !appUser) {
        return Result.fail<ForumPost>('User profile not found');
      }

      // Upload media files if provided
      const mediaUrls: string[] = [];
      if (formData.media && formData.media.length > 0) {
        for (const file of formData.media) {
          // Validate file size (5MB limit)
          if (file.size > 5 * 1024 * 1024) {
            return Result.fail<ForumPost>('File size must be less than 5MB');
          }

          // Validate file type
          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
            return Result.fail<ForumPost>('Only JPG and PNG files are allowed');
          }

          const fileName = `${appUser.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('forum-media')
            .upload(fileName, file);

          if (uploadError) {
            return Result.fail<ForumPost>('Failed to upload media');
          }

          const { data: urlData } = supabase.storage
            .from('forum-media')
            .getPublicUrl(fileName);

          mediaUrls.push(urlData.publicUrl);
        }
      }

      // Create post
      const { data, error } = await supabase
        .from('forum_posts')
        .insert({
          user_id: appUser.id,
          title: formData.title,
          content: formData.content,
          category: formData.category,
          tags: uniqueTags,
          media_urls: mediaUrls,
        })
        .select(`
          *,
          app_users!inner (
            username,
            avatar_url,
            display_name
          )
        `)
        .single();

      if (error) {
        return Result.fail<ForumPost>(error.message);
      }

      const post = {
        ...data,
        username: data.app_users?.username,
        avatar_url: data.app_users?.avatar_url,
        display_name: data.app_users?.display_name,
      };

      return Result.ok(post);
    } catch (error) {
      return Result.fail<ForumPost>('Failed to create post');
    }
  }
);

// Edit existing post
export const editPostThunk = createAsyncThunk(
  'forum/editPost',
  async ({ postId, updates }: { postId: string; updates: Partial<PostFormData> }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumPost>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ForumPost>('User profile not found');
      }

      const { data, error } = await supabase
        .from('forum_posts')
        .update({
          title: updates.title,
          content: updates.content,
          category: updates.category,
          tags: updates.tags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', appUser.id)
        .select()
        .single();

      if (error) {
        return Result.fail<ForumPost>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<ForumPost>('Failed to edit post');
    }
  }
);

// Delete post with confirmation
export const deletePostThunk = createAsyncThunk(
  'forum/deletePost',
  async (postId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<void>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<void>('User profile not found');
      }

      const { error } = await supabase
        .from('forum_posts')
        .update({ is_deleted: true })
        .eq('id', postId)
        .eq('user_id', appUser.id);

      if (error) {
        return Result.fail<void>(error.message);
      }

      return Result.ok(undefined);
    } catch (error) {
      return Result.fail<void>('Failed to delete post');
    }
  }
);

// Upvote/Downvote thunks
export const upvoteThunk = createAsyncThunk(
  'forum/upvote',
  async ({ targetId, targetType }: { targetId: string; targetType: 'post' | 'comment' }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumVote>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ForumVote>('User profile not found');
      }

      const voteData = {
        user_id: appUser.id,
        vote_type: 'upvote' as const,
        ...(targetType === 'post' ? { post_id: targetId } : { comment_id: targetId }),
      };

      const { data, error } = await supabase
        .from('forum_votes')
        .upsert(voteData, { onConflict: targetType === 'post' ? 'user_id,post_id' : 'user_id,comment_id' })
        .select()
        .single();

      if (error) {
        return Result.fail<ForumVote>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<ForumVote>('Failed to upvote');
    }
  }
);

export const downvoteThunk = createAsyncThunk(
  'forum/downvote',
  async ({ targetId, targetType }: { targetId: string; targetType: 'post' | 'comment' }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumVote>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ForumVote>('User profile not found');
      }

      const voteData = {
        user_id: appUser.id,
        vote_type: 'downvote' as const,
        ...(targetType === 'post' ? { post_id: targetId } : { comment_id: targetId }),
      };

      const { data, error } = await supabase
        .from('forum_votes')
        .upsert(voteData, { onConflict: targetType === 'post' ? 'user_id,post_id' : 'user_id,comment_id' })
        .select()
        .single();

      if (error) {
        return Result.fail<ForumVote>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<ForumVote>('Failed to downvote');
    }
  }
);

// Report post
export const reportPostThunk = createAsyncThunk(
  'forum/reportPost',
  async ({ targetId, targetType, reason }: { targetId: string; targetType: 'post' | 'comment'; reason: string }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumReport>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ForumReport>('User profile not found');
      }

      const reportData = {
        reporter_id: appUser.id,
        reason,
        ...(targetType === 'post' ? { post_id: targetId } : { comment_id: targetId }),
      };

      const { data, error } = await supabase
        .from('forum_reports')
        .insert(reportData)
        .select()
        .single();

      if (error) {
        return Result.fail<ForumReport>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<ForumReport>('Failed to report');
    }
  }
);

// Fetch comments with nested tree structure
export const fetchCommentsThunk = createAsyncThunk(
  'forum/fetchComments',
  async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('forum_comments')
        .select(`
          *,
          app_users!inner (
            username,
            avatar_url,
            display_name
          )
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        return Result.fail<ForumComment[]>(error.message);
      }

      // Build nested comment tree
      const commentMap = new Map<string, ForumComment>();
      const rootComments: ForumComment[] = [];

      data?.forEach(comment => {
        const formattedComment: ForumComment = {
          ...comment,
          username: comment.app_users?.username,
          avatar_url: comment.app_users?.avatar_url,
          display_name: comment.app_users?.display_name,
          replies: [],
        };
        commentMap.set(comment.id, formattedComment);
      });

      commentMap.forEach(comment => {
        if (comment.parent_id) {
          const parent = commentMap.get(comment.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      return Result.ok(rootComments);
    } catch (error) {
      return Result.fail<ForumComment[]>('Failed to fetch comments');
    }
  }
);

// Create comment with parent support
export const createCommentThunk = createAsyncThunk(
  'forum/createComment',
  async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
    try {
      if (!content?.trim()) {
        return Result.fail<ForumComment>('Comment content is required');
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ForumComment>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id, username, avatar_url')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ForumComment>('User profile not found');
      }

      const { data, error } = await supabase
        .from('forum_comments')
        .insert({
          post_id: postId,
          user_id: appUser.id,
          parent_id: parentId,
          content,
        })
        .select()
        .single();

      if (error) {
        return Result.fail<ForumComment>(error.message);
      }

      const comment: ForumComment = {
        ...data,
        username: appUser.username,
        avatar_url: appUser.avatar_url,
        replies: [],
      };

      return Result.ok(comment);
    } catch (error) {
      return Result.fail<ForumComment>('Failed to create comment');
    }
  }
);
