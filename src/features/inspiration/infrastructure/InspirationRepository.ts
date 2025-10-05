import { Result } from '@/core/domain/base/Result';
import { supabase } from '@/core/infrastructure/supabase/client';
import {
  fetchInspirationItems,
  fetchInspirationItemById,
  subscribeToInspirationRealtime,
  toggleInspirationCollect,
  toggleInspirationLike,
  type InspirationFeedRow,
  type FetchInspirationRequest,
} from '@/services/inspiration';
import {
  InspirationItem,
  InspirationPage,
  InspirationFilterState,
  InspirationSortOption,
} from '../domain/Inspiration.types';
import { InspirationMapper } from './InspirationMapper';

interface FetchFeedParams {
  readonly filters?: InspirationFilterState;
  readonly page: number;
  readonly sort: InspirationSortOption;
  readonly userId?: string;
}

type CollectRow = { portfolio_id: string };
type FollowRow = { followed_id: string };

interface ItemStatusSets {
  readonly collected: Set<string>;
  readonly liked: Set<string>;
  readonly followingProviders: Set<string>;
}

const buildStatusSets = async (
  rows: InspirationFeedRow[],
  userId?: string
): Promise<Result<ItemStatusSets, Error>> => {
  if (!userId || rows.length === 0) {
    return Result.ok({
      collected: new Set<string>(),
      liked: new Set<string>(),
      followingProviders: new Set<string>(),
    });
  }

  const portfolioIds = rows.map((row) => row.id);
  const providerIds = Array.from(new Set(rows.map((row) => row.provider_id)));

  try {
    const [
      { data: collectRows, error: collectError },
      { data: likeRows, error: likeError },
      { data: followRows, error: followError },
    ] = await Promise.all([
      supabase
        .from<CollectRow>('inspiration_collects')
        .select('portfolio_id')
        .eq('user_id', userId)
        .in('portfolio_id', portfolioIds),
      supabase
        .from<CollectRow>('inspiration_likes')
        .select('portfolio_id')
        .eq('user_id', userId)
        .in('portfolio_id', portfolioIds),
      supabase
        .from<FollowRow>('follows')
        .select('followed_id')
        .eq('follower_id', userId)
        .in('followed_id', providerIds),
    ]);

    if (collectError != null) {
      return Result.fail(new Error(collectError.message));
    }

    if (likeError != null) {
      return Result.fail(new Error(likeError.message));
    }

    if (followError != null) {
      return Result.fail(new Error(followError.message));
    }

    const collected = new Set((collectRows ?? []).map((row) => row.portfolio_id));
    const liked = new Set((likeRows ?? []).map((row) => row.portfolio_id));
    const followingProviders = new Set((followRows ?? []).map((row) => row.followed_id));

    return Result.ok({ collected, liked, followingProviders });
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

const mapItems = (
  rows: InspirationFeedRow[],
  sets: ItemStatusSets
): InspirationItem[] => {
  return rows.map((row) =>
    InspirationMapper.toDomain(row, {
      isCollected: sets.collected.has(row.id),
      isLiked: sets.liked.has(row.id),
      isFollowing: sets.followingProviders.has(row.provider_id),
      personalizationScore: row.personalization_score,
    })
  );
};

export class InspirationRepository {
  async fetchFeed(params: FetchFeedParams): Promise<Result<InspirationPage, Error>> {
    try {
      const request: FetchInspirationRequest = {
        filters: params.filters,
        page: params.page,
        sort: params.sort,
        userId: params.userId,
      };

      const feedResult = await fetchInspirationItems(request);

      if (feedResult.isFailure()) {
        return Result.fail(feedResult.getError());
      }

      const payload = feedResult.getValue();

      const statusResult = await buildStatusSets(payload.items, params.userId);
      if (statusResult.isFailure()) {
        return Result.fail(statusResult.getError());
      }

      const mapped = mapItems(payload.items, statusResult.getValue());

      return Result.ok({
        items: mapped,
        hasMore: payload.hasMore,
        nextPage: payload.nextPage,
        total: payload.total,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchItemById(
    id: string,
    userId?: string
  ): Promise<Result<InspirationItem | null, Error>> {
    try {
      const result = await fetchInspirationItemById(id);

      if (result.isFailure()) {
        return Result.fail(result.getError());
      }

      const row = result.getValue();
      if (!row) {
        return Result.ok(null);
      }

      const statusResult = await buildStatusSets([row], userId);
      if (statusResult.isFailure()) {
        return Result.fail(statusResult.getError());
      }

      const sets = statusResult.getValue();
      const mapped = InspirationMapper.toDomain(row, {
        isCollected: sets.collected.has(row.id),
        isLiked: sets.liked.has(row.id),
        isFollowing: sets.followingProviders.has(row.provider_id),
        personalizationScore: row.personalization_score,
      });

      return Result.ok(mapped);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async toggleCollect(
    portfolioId: string,
    userId: string,
    shouldCollect: boolean
  ): Promise<Result<boolean, Error>> {
    return await toggleInspirationCollect(portfolioId, userId, shouldCollect);
  }

  async toggleLike(
    portfolioId: string,
    userId: string,
    shouldLike: boolean
  ): Promise<Result<boolean, Error>> {
    return await toggleInspirationLike(portfolioId, userId, shouldLike);
  }

  async toggleFollowProvider(
    providerId: string,
    userId: string,
    shouldFollow: boolean
  ): Promise<Result<boolean, Error>> {
    try {
      if (shouldFollow) {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: userId, followed_id: providerId });

        if (error && error.code !== '23505') {
          return Result.fail(new Error(error.message));
        }

        return Result.ok(true);
      }

      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('followed_id', providerId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(false);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  subscribeToRealtime(params: {
    readonly userId?: string;
    readonly onInsert?: (item: InspirationItem) => void;
    readonly onUpdate?: (item: InspirationItem) => void;
  }): () => void {
    const { userId, onInsert, onUpdate } = params;

    return subscribeToInspirationRealtime({
      onInsert: (row) => {
        if (!onInsert) {
          return;
        }

        void (async () => {
          const statusResult = await buildStatusSets([row], userId);
          if (statusResult.isFailure()) {
            console.error('Failed to resolve inspiration collect state', statusResult.getError());
            return;
          }

          const sets = statusResult.getValue();
          const mapped = InspirationMapper.toDomain(row, {
            isCollected: sets.collected.has(row.id),
            isLiked: sets.liked.has(row.id),
            isFollowing: sets.followingProviders.has(row.provider_id),
            personalizationScore: row.personalization_score,
          });
          onInsert(mapped);
        })();
      },
      onUpdate: (row) => {
        if (!onUpdate) {
          return;
        }

        void (async () => {
          const statusResult = await buildStatusSets([row], userId);
          if (statusResult.isFailure()) {
            console.error('Failed to resolve inspiration collect state', statusResult.getError());
            return;
          }

          const sets = statusResult.getValue();
          const mapped = InspirationMapper.toDomain(row, {
            isCollected: sets.collected.has(row.id),
            isLiked: sets.liked.has(row.id),
            isFollowing: sets.followingProviders.has(row.provider_id),
            personalizationScore: row.personalization_score,
          });
          onUpdate(mapped);
        })();
      },
    });
  }
}
