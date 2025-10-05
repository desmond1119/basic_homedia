/**
 * Profile Repository
 * Data access layer for user profiles
 */

import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { UserProfile, Post } from '../domain/Forum.types';
import { ForumMapper } from './ForumMapper';

export class ProfileRepository {
  async getUserProfile(
    userId: string,
    currentUserId?: string
  ): Promise<Result<UserProfile | null, Error>> {
    try {
      const { data: user, error: userError } = await supabase
        .from('app_users')
        .select('id, username, email, full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          return Result.ok(null);
        }
        return Result.fail(new Error(userError.message));
      }

      const { data: stats, error: statsError } = await supabase.rpc(
        'get_user_stats',
        { user_uuid: userId }
      );

      if (statsError) {
        return Result.fail(new Error(statsError.message));
      }

      let isFollowing = false;
      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase.rpc('user_follows', {
          follower_uuid: currentUserId,
          followed_uuid: userId,
        });
        isFollowing = followData || false;
      }

      const profile: UserProfile = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        avatarUrl: user.avatar_url,
        bio: null, // Can be added to app_users table
        followerCount: Number(stats?.[0]?.follower_count || 0),
        followingCount: Number(stats?.[0]?.following_count || 0),
        postCount: Number(stats?.[0]?.post_count || 0),
        isFollowing,
      };

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async getUserPosts(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<Result<Post[], Error>> {
    try {
      const { data, error } = await supabase
        .from('posts_with_user')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

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

  async getFollowers(userId: string): Promise<Result<UserProfile[], Error>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, app_users!follows_follower_id_fkey(id, username, avatar_url, full_name)')
        .eq('followed_id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const followers = (data || []).map((f) => {
        const user = f.app_users as unknown as {
          id: string;
          username: string;
          avatar_url: string | null;
          full_name: string | null;
        };
        return {
          id: user.id,
          username: user.username,
          email: '',
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          bio: null,
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
        };
      });

      return Result.ok(followers);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }

  async getFollowing(userId: string): Promise<Result<UserProfile[], Error>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id, app_users!follows_followed_id_fkey(id, username, avatar_url, full_name)')
        .eq('follower_id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const following = (data || []).map((f) => {
        const user = f.app_users as unknown as {
          id: string;
          username: string;
          avatar_url: string | null;
          full_name: string | null;
        };
        return {
          id: user.id,
          username: user.username,
          email: '',
          fullName: user.full_name,
          avatarUrl: user.avatar_url,
          bio: null,
          followerCount: 0,
          followingCount: 0,
          postCount: 0,
        };
      });

      return Result.ok(following);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error')
      );
    }
  }
}
