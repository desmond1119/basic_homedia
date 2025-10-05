import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ProfileStatsMapper } from './ProfileStatsMapper';
import { UserStats, CollectedImage, FollowedCompany, CollectionTab } from '../domain/Profile.types';

export class ProfileStatsRepository {
  async fetchUserStats(userId: string): Promise<Result<UserStats, Error>> {
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError) return Result.fail(new Error(statsError.message));
      if (!statsData) return Result.fail(new Error('User stats not found'));

      const { data: badgesData, error: badgesError } = await supabase
        .rpc('calculate_user_badges', { p_user_id: userId });

      const badges = badgesError ? null : badgesData;

      return Result.ok(ProfileStatsMapper.toUserStats(statsData, badges));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchCollectedImages(userId: string, limit = 20, offset = 0): Promise<Result<CollectedImage[], Error>> {
    try {
      const { data, error } = await supabase
        .from('user_collected_images')
        .select('*')
        .eq('user_id', userId)
        .order('collected_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return Result.fail(new Error(error.message));

      const images = (data || []).map((row) => ProfileStatsMapper.toCollectedImage(row));
      return Result.ok(images);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchFollowedCompanies(userId: string, limit = 20, offset = 0): Promise<Result<FollowedCompany[], Error>> {
    try {
      const { data, error } = await supabase
        .from('user_followed_companies')
        .select('*')
        .eq('user_id', userId)
        .order('followed_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) return Result.fail(new Error(error.message));

      const companies = (data || []).map((row) => ProfileStatsMapper.toFollowedCompany(row));
      return Result.ok(companies);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  subscribeToStats(userId: string, callback: (stats: UserStats) => void): () => void {
    const channel = supabase
      .channel(`user_stats:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `follower_id=eq.${userId}`,
        },
        async () => {
          const result = await this.fetchUserStats(userId);
          if (result.isSuccess()) {
            const stats = result.getValue();
            if (stats) callback(stats);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const result = await this.fetchUserStats(userId);
          if (result.isSuccess()) {
            const stats = result.getValue();
            if (stats) callback(stats);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          const result = await this.fetchUserStats(userId);
          if (result.isSuccess()) {
            const stats = result.getValue();
            if (stats) callback(stats);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}
