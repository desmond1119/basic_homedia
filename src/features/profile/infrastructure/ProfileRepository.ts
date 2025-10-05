// Profile Repository - Data access layer for user profiles
import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ProfileMapper } from './ProfileMapper';
import { UserProfile, UpdateProfileData, BookmarkedPost, FollowerUser } from '../domain/Profile.types';

export class ProfileRepository {
  // Fetch user profile with stats
  async getProfile(userId: string): Promise<Result<UserProfile | null, Error>> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return Result.fail(new Error('Not authenticated'));
      }

      console.log('Fetching profile for user:', userId);
      console.log('Current session user:', session.user.id);

      // Try RPC function first
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_profile_with_stats', {
        user_uuid: userId,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        const profile = ProfileMapper.toUserProfile(rpcData[0]);
        return Result.ok(profile);
      }

      // Fallback: Query app_users table directly (more reliable than view)
      console.warn('RPC function failed, using direct app_users query');
      
      const { data: userData, error: userError } = await supabase
        .from('app_users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('Failed to fetch from app_users:', userError);
        console.error('Error code:', userError.code);
        console.error('Error details:', userError.details);
        console.error('Error hint:', userError.hint);
        
        // If RLS error, provide helpful message
        if (userError.code === 'PGRST301' || userError.message.includes('row-level security')) {
          return Result.fail(new Error('Database permission error. Please ensure RLS policies are correctly set up.'));
        }
        
        return Result.fail(new Error(userError.message));
      }

      if (!userData) {
        console.warn('No user found with id:', userId);
        return Result.ok(null);
      }

      console.log('User data fetched successfully:', userData.username);

      // Build profile data with all required fields (stats default to 0)
      const profileData = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name || null,
        avatar_url: userData.avatar_url || null,
        bio: userData.bio || null,
        location: null as string | null,
        website: null as string | null,
        company_name: userData.company_name || null,
        role: userData.role,
        provider_type_id: userData.provider_type_id || null,
        is_active: userData.is_active ?? true,
        created_at: userData.created_at || new Date().toISOString(),
        updated_at: userData.updated_at || userData.created_at || new Date().toISOString(),
        follower_count: 0,
        following_count: 0,
        post_count: 0,
        bookmark_count: 0,
      };

      console.log('Profile data assembled:', profileData.username);

      const profile = ProfileMapper.toUserProfile(profileData);
      return Result.ok(profile);
    } catch (error) {
      console.error('Unexpected error in getProfile:', error);
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
