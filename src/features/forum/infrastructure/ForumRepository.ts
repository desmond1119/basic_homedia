/**
 * Forum Repository
 * Data access layer for forum operations
 */

import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ForumMapper } from './ForumMapper';
import {
  Category,
  Post,
  Comment,
  CreatePostData,
  CreateCommentData,
  UpdatePostData,
  CreateCategoryData,
} from '../domain/Forum.types';

export class ForumRepository {
  async getCategories(): Promise<Result<Category[], Error>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok((data || []).map(ForumMapper.toCategory));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          icon: data.icon || null,
          display_order: data.displayOrder || 0,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return ForumMapper.toCategory(category);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }

  // Posts
  async getPosts(
    categoryId?: string,
    limit = 20,
    offset = 0
  ): Promise<Result<Post[], Error>> {
    try {
      let query = supabase
        .from('posts_with_user')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const posts = (data || []).map(ForumMapper.toPost);
      return Result.ok(posts);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async getPostById(postId: string): Promise<Result<Post | null, Error>> {
    try {
      const { data, error } = await supabase
        .from('posts_with_user')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new Error(error.message));
      }

      return Result.ok(ForumMapper.toPost(data));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async createPost(
    userId: string,
    data: CreatePostData
  ): Promise<Result<Post, Error>> {
    try {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          category_id: data.categoryId,
          title: data.title,
          content: data.content,
          tags: data.tags || [],
          media_urls: data.mediaUrls || [],
        })
        .select()
        .single();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      // Fetch full post with user data
      const fullPostResult = await this.getPostById(post.id);
      if (fullPostResult.isFailure()) {
        return Result.fail(fullPostResult.getError());
      }

      const fullPost = fullPostResult.getValue();
      if (!fullPost) {
        return Result.fail(new Error('Failed to fetch created post'));
      }

      return Result.ok(fullPost);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async updatePost(
    postId: string,
    data: UpdatePostData
  ): Promise<Result<Post, Error>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.mediaUrls !== undefined) updateData.media_urls = data.mediaUrls;

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const postResult = await this.getPostById(postId);
      if (postResult.isFailure()) {
        return Result.fail(postResult.getError());
      }

      const post = postResult.getValue();
      if (!post) {
        return Result.fail(new Error('Post not found after update'));
      }

      return Result.ok(post);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async deletePost(postId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_deleted: true })
        .eq('id', postId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Comments
  async getCommentsByPostId(postId: string): Promise<Result<Comment[], Error>> {
    try {
      const { data, error } = await supabase
        .from('comments_with_user')
        .select('*')
        .eq('post_id', postId)
        .order('created_at');

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const comments = (data || []).map(ForumMapper.toComment);
      
      // Organize nested comments
      const commentMap = new Map<string, Comment>();
      const topLevelComments: Comment[] = [];

      comments.forEach((comment) => {
        commentMap.set(comment.id, { ...comment, replies: [] });
      });

      comments.forEach((comment) => {
        const commentWithReplies = commentMap.get(comment.id);
        if (!commentWithReplies) return;

        if (comment.parentId) {
          const parent = commentMap.get(comment.parentId);
          if (parent && parent.replies) {
            parent.replies.push(commentWithReplies);
          }
        } else {
          topLevelComments.push(commentWithReplies);
        }
      });

      return Result.ok(topLevelComments);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async createComment(
    userId: string,
    data: CreateCommentData
  ): Promise<Result<Comment, Error>> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: data.postId,
          user_id: userId,
          parent_id: data.parentId || null,
          content: data.content,
          media_urls: data.mediaUrls || [],
        })
        .select()
        .single();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(ForumMapper.toComment(comment));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async deleteComment(commentId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', commentId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Likes
  async likeTarget(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment'
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('likes').insert({
        user_id: userId,
        target_id: targetId,
        target_type: targetType,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async unlikeTarget(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment'
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('target_id', targetId)
        .eq('target_type', targetType);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async checkIfLiked(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment'
  ): Promise<Result<boolean, Error>> {
    try {
      const { data, error } = await supabase.rpc('user_liked_target', {
        target_uuid: targetId,
        target_type_str: targetType,
        user_uuid: userId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(data || false);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Follows
  async followUser(
    followerId: string,
    followedId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('follows').insert({
        follower_id: followerId,
        followed_id: followedId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async unfollowUser(
    followerId: string,
    followedId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('followed_id', followedId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Bookmarks
  async bookmarkPost(
    userId: string,
    postId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: userId,
        post_id: postId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async unbookmarkPost(
    userId: string,
    postId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async getBookmarkedPosts(userId: string): Promise<Result<Post[], Error>> {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const postIds = (data || []).map((b) => b.post_id);

      if (postIds.length === 0) {
        return Result.ok([]);
      }

      const { data: posts, error: postsError } = await supabase
        .from('posts_with_user')
        .select('*')
        .in('id', postIds);

      if (postsError) {
        return Result.fail(new Error(postsError.message));
      }

      return Result.ok((posts || []).map(ForumMapper.toPost));
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Reposts
  async repostPost(
    userId: string,
    postId: string,
    comment?: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('reposts').insert({
        user_id: userId,
        post_id: postId,
        comment: comment || null,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async unrepostPost(
    userId: string,
    postId: string
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('reposts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  // Upload media
  async uploadMedia(file: File, userId: string): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('forum-media')
        .upload(fileName, file);

      if (error) {
        throw new Error(error.message);
      }

      const { data: urlData } = supabase.storage
        .from('forum-media')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }
}
