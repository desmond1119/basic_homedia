import { supabase } from '@/core/infrastructure/supabase/client';
import { ProfileStatsMapper } from './ProfileStatsMapper';
import { UserStats, CollectedImage, FollowedCompany } from '../domain/Profile.types';

export class ProfileStatsRepositoryFixed {
  async fetchUserStats(userId: string): Promise<UserStats> {
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw new Error(userError.message);
    if (!userData) throw new Error('User not found');

    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', userId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    const statsData: any = {
      user_id: userData.id,
      username: userData.username,
      full_name: userData.full_name,
      avatar_url: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      website: userData.website,
      company_name: userData.company_name,
      followers_count: followersCount || 0,
      following_count: followingCount || 0,
      collected_images_count: 0,
      followed_companies_count: 0,
      forum_responses_count: (commentsCount || 0) + (postsCount || 0),
      created_at: userData.created_at,
    };

    return ProfileStatsMapper.toUserStats(statsData, []);
  }

  async fetchCollectedImages(userId: string, limit = 20, offset = 0): Promise<CollectedImage[]> {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        post_id,
        posts (
          id,
          title,
          content,
          media_urls
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return (data || []).map((bookmark: any) => ({
      bookmarkId: bookmark.id,
      collectedAt: bookmark.created_at,
      portfolioId: bookmark.post_id || '',
      title: bookmark.posts?.title || '',
      coverImageUrl: bookmark.posts?.media_urls?.[0] || null,
      providerName: '',
      providerAvatar: null,
      likesCount: 0,
      viewsCount: 0,
    }));
  }

  async fetchFollowedCompanies(userId: string, limit = 20, offset = 0): Promise<FollowedCompany[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        id,
        created_at,
        followed_id,
        app_users!follows_followed_id_fkey (
          id,
          username,
          full_name,
          avatar_url,
          bio,
          company_name
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return (data || []).map((follow: any) => ({
      followId: follow.id,
      followedAt: follow.created_at,
      companyId: follow.followed_id,
      username: follow.app_users?.username || '',
      companyName: follow.app_users?.company_name || follow.app_users?.full_name || '',
      logoUrl: follow.app_users?.avatar_url || null,
      bio: follow.app_users?.bio || null,
      portfoliosCount: 0,
      avgRating: 0,
    }));
  }

  subscribeToStats(userId: string, callback: (stats: UserStats) => void): () => void {
    const refreshStats = async () => {
      try {
        const stats = await this.fetchUserStats(userId);
        callback(stats);
      } catch (error) {
        console.error('Failed to refresh stats:', error);
      }
    };

    const channel = supabase
      .channel(`user_stats:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_users',
          filter: `id=eq.${userId}`,
        },
        refreshStats
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}
