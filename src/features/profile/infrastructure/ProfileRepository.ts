// Profile Repository - Data access layer for user profiles
import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ProfileMapper } from './ProfileMapper';
import { UserProfile, UpdateProfileData, BookmarkedPost, FollowerUser } from '../domain/Profile.types';

export class ProfileRepository {
  // Fetch user profile with stats
  async getProfile(userId: string): Promise<Result<UserProfile | null, Error>> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile_with_stats', {
        user_uuid: userId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      if (!data || data.length === 0) {
        return Result.ok(null);
      }

      const profile = ProfileMapper.toUserProfile(data[0]);
      return Result.ok(profile);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileData): Promise<Result<UserProfile, Error>> {
    try {
      // Validate bio length
      if (data.bio && data.bio.length > 500) {
        return Result.fail(new Error('Bio must be 500 characters or less'));
      }

      const updateData: Record<string, unknown> = {};
      if (data.username !== undefined) updateData.username = data.username;
      if (data.fullName !== undefined) updateData.full_name = data.fullName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.website !== undefined) updateData.website = data.website;
      if (data.companyName !== undefined) updateData.company_name = data.companyName;
      if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      // Fetch updated profile
      const profileResult = await this.getProfile(userId);
      if (profileResult.isFailure()) {
        return Result.fail(profileResult.getError());
      }

      const profile = profileResult.getValue();
      if (!profile) {
        return Result.fail(new Error('Profile not found after update'));
      }

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Upload avatar to Supabase Storage
  async uploadAvatar(userId: string, file: File): Promise<Result<string, Error>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return Result.fail(new Error(uploadError.message));
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return Result.ok(urlData.publicUrl);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Get user bookmarks
  async getUserBookmarks(userId: string): Promise<Result<BookmarkedPost[], Error>> {
    try {
      const { data, error } = await supabase.rpc('get_user_bookmarks', {
        user_uuid: userId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const bookmarks = (data || []).map(ProfileMapper.toBookmarkedPost);
      return Result.ok(bookmarks);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Get followers
  async getFollowers(userId: string): Promise<Result<FollowerUser[], Error>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('follower_id, app_users!follows_follower_id_fkey(id, username, full_name, avatar_url, bio)')
        .eq('followed_id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const followers = (data || []).map((item) => {
        const user = item.app_users as unknown as {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
        };
        return ProfileMapper.toFollowerUser(user);
      });

      return Result.ok(followers);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  // Get following
  async getFollowing(userId: string): Promise<Result<FollowerUser[], Error>> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id, app_users!follows_followed_id_fkey(id, username, full_name, avatar_url, bio)')
        .eq('follower_id', userId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const following = (data || []).map((item) => {
        const user = item.app_users as unknown as {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
        };
        return ProfileMapper.toFollowerUser(user);
      });

      return Result.ok(following);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
