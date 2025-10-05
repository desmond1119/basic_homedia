import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';

export type InspirationSortOption = 'newest' | 'popular' | 'personalized';

export interface InspirationFilters {
  readonly type?: string;
  readonly location?: string;
  readonly priceMin?: number;
  readonly priceMax?: number;
  readonly ratingMin?: number;
  readonly tag?: string;
}

export interface InspirationFeedRow {
  readonly id: string;
  readonly provider_id: string;
  readonly title: string;
  readonly description: string | null;
  readonly image_url: string;
  readonly gallery_images: unknown;
  readonly project_type: string | null;
  readonly project_year: number | null;
  readonly location: string | null;
  readonly price_min: number | null;
  readonly price_max: number | null;
  readonly currency_code: string | null;
  readonly tags: string[] | null;
  readonly is_featured: boolean | null;
  readonly pinned: boolean | null;
  readonly created_at: string | null;
  readonly updated_at: string | null;
  readonly company_name: string | null;
  readonly logo_url: string | null;
  readonly avatar_url: string | null;
  readonly username: string | null;
  readonly overall_rating: number | null;
  readonly total_reviews: number | null;
  readonly is_sponsored: boolean | null;
  readonly is_verified: boolean | null;
  readonly role: string | null;
  readonly collect_count: number | null;
  readonly like_count: number | null;
  readonly pin_rank: number | null;
  readonly personalization_score?: number;
}

export interface FetchInspirationRequest {
  readonly filters?: InspirationFilters;
  readonly page: number;
  readonly sort: InspirationSortOption;
  readonly userId?: string;
}

export interface FetchInspirationResponse {
  readonly items: InspirationFeedRow[];
  readonly hasMore: boolean;
  readonly nextPage: number | null;
  readonly total?: number;
}

const PAGE_SIZE = 20;
const PERSONALIZED_FETCH_MULTIPLIER = 3;

type FilterableQuery<T> = T & {
  eq: (column: string, value: unknown) => T;
  gte: (column: string, value: number) => T;
  lte: (column: string, value: number) => T;
  contains: (column: string, value: unknown) => T;
};

const applyFilters = <T extends FilterableQuery<T>>(
  initialQuery: T,
  filters?: InspirationFilters
): T => {
  let query = initialQuery;

  if (!filters) {
    return query;
  }

  if (filters.type) {
    query = query.eq('project_type', filters.type);
  }

  if (filters.location) {
    query = query.eq('location', filters.location);
  }

  if (filters.priceMin !== undefined) {
    query = query.gte('price_min', filters.priceMin);
  }

  if (filters.priceMax !== undefined) {
    query = query.lte('price_max', filters.priceMax);
  }

  if (filters.ratingMin !== undefined) {
    query = query.gte('overall_rating', filters.ratingMin);
  }

  if (filters.tag) {
    query = query.contains('tags', [filters.tag]);
  }

  return query;
};

interface PortfolioSnapshot {
  readonly tags: string[] | null;
  readonly project_type: string | null;
  readonly provider_id: string;
}

interface CollectVectorRow {
  readonly portfolio_id: string;
  readonly portfolio: PortfolioSnapshot | null;
}

const fetchUserCollectVectors = async (
  userId: string
): Promise<Result<{ tags: Map<string, number>; providers: Map<string, number>; types: Map<string, number> }, Error>> => {
  try {
    const { data, error } = await supabase
      .from<CollectVectorRow>('inspiration_collects')
      .select(
        `portfolio_id,
         portfolio:provider_portfolios(tags, project_type, provider_id)`
      )
      .eq('user_id', userId);

    if (error != null) {
      return Result.fail(new Error(error.message));
    }

    const tagWeights = new Map<string, number>();
    const providerWeights = new Map<string, number>();
    const typeWeights = new Map<string, number>();

    for (const entry of data ?? []) {
      const { portfolio } = entry;

      if (!portfolio) {
        continue;
      }

      if (Array.isArray(portfolio.tags)) {
        for (const tag of portfolio.tags) {
          const key = tag.toLowerCase();
          tagWeights.set(key, (tagWeights.get(key) ?? 0) + 1);
        }
      }

      if (portfolio.project_type) {
        const key = portfolio.project_type.toLowerCase();
        typeWeights.set(key, (typeWeights.get(key) ?? 0) + 1);
      }

      providerWeights.set(
        portfolio.provider_id,
        (providerWeights.get(portfolio.provider_id) ?? 0) + 1
      );
    }

    return Result.ok({ tags: tagWeights, providers: providerWeights, types: typeWeights });
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

const computePersonalizedScore = (
  item: InspirationFeedRow,
  vectors: { tags: Map<string, number>; providers: Map<string, number>; types: Map<string, number> }
): number => {
  let score = 0;

  if (item.pinned) {
    score += 5;
  }

  if (item.is_featured) {
    score += 3;
  }

  if (item.collect_count) {
    score += Math.min(item.collect_count, 50) * 0.4;
  }

  if (item.like_count) {
    score += Math.min(item.like_count, 50) * 0.2;
  }

  if (item.overall_rating) {
    score += item.overall_rating * 0.8;
  }

  if (item.provider_id && vectors.providers.has(item.provider_id)) {
    score += (vectors.providers.get(item.provider_id) ?? 0) * 2;
  }

  if (item.project_type) {
    const weight = vectors.types.get(item.project_type.toLowerCase()) ?? 0;
    score += weight * 1.5;
  }

  if (Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const weight = vectors.tags.get(tag.toLowerCase()) ?? 0;
      score += weight;
    }
  }

  return score;
};

export const fetchInspirationItems = async (
  params: FetchInspirationRequest
): Promise<Result<FetchInspirationResponse, Error>> => {
  try {
    const { filters, page, sort, userId } = params;
    const rangeStart = page * PAGE_SIZE;
    const fetchSize = sort === 'personalized' ? PAGE_SIZE * PERSONALIZED_FETCH_MULTIPLIER : PAGE_SIZE;
    const rangeEnd = rangeStart + fetchSize - 1;

    let query = supabase
      .from<InspirationFeedRow>('inspiration_feed')
      .select('*', { count: 'exact' });

    query = applyFilters(query, filters);

    if (sort === 'popular') {
      query = query
        .order('pin_rank', { ascending: false })
        .order('collect_count', { ascending: false })
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false });
    } else {
      query = query
        .order('pin_rank', { ascending: false })
        .order('created_at', { ascending: false });
    }

    const { data, error, count } = await query.range(rangeStart, rangeEnd);

    if (error) {
      return Result.fail(new Error(error.message));
    }

    const rows = data ?? [];

    if (sort === 'personalized' && userId) {
      const vectorsResult = await fetchUserCollectVectors(userId);

      if (vectorsResult.isFailure()) {
        return Result.fail(vectorsResult.getError());
      }

      const vectors = vectorsResult.getValue();
      const ranked = [...rows]
        .map((item) => ({ item, score: computePersonalizedScore(item, vectors) }))
        .sort((a, b) =>
          b.score - a.score ||
          new Date(b.item.created_at ?? 0).getTime() - new Date(a.item.created_at ?? 0).getTime()
        );

      const limited = ranked.slice(0, PAGE_SIZE).map((entry) => ({
        ...entry.item,
        personalization_score: entry.score,
      }));
      const hasMore = count !== null ? rangeStart + limited.length < (count ?? 0) : ranked.length > PAGE_SIZE;

      return Result.ok({
        items: limited,
        hasMore,
        nextPage: hasMore ? page + 1 : null,
        total: count ?? undefined,
      });
    }

    const hasMore = count !== null ? rangeStart + rows.length < (count ?? 0) : rows.length === fetchSize;

    return Result.ok({
      items: rows,
      hasMore,
      nextPage: hasMore ? page + 1 : null,
      total: count ?? undefined,
    });
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

export const fetchInspirationItemById = async (
  id: string
): Promise<Result<InspirationFeedRow | null, Error>> => {
  try {
    const { data, error } = await supabase
      .from<InspirationFeedRow>('inspiration_feed')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return Result.fail(new Error(error.message));
    }

    return Result.ok(data ?? null);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

export const toggleInspirationCollect = async (
  portfolioId: string,
  userId: string,
  shouldCollect: boolean
): Promise<Result<boolean, Error>> => {
  try {
    if (shouldCollect) {
      const { error } = await supabase
        .from('inspiration_collects')
        .insert({ portfolio_id: portfolioId, user_id: userId });

      if (error && error.code !== '23505') {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    }

    const { error } = await supabase
      .from('inspiration_collects')
      .delete()
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId);

    if (error) {
      return Result.fail(new Error(error.message));
    }

    return Result.ok(false);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

export const toggleInspirationLike = async (
  portfolioId: string,
  userId: string,
  shouldLike: boolean
): Promise<Result<boolean, Error>> => {
  try {
    if (shouldLike) {
      const { error } = await supabase
        .from('inspiration_likes')
        .insert({ portfolio_id: portfolioId, user_id: userId });

      if (error && error.code !== '23505') {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    }

    const { error } = await supabase
      .from('inspiration_likes')
      .delete()
      .eq('portfolio_id', portfolioId)
      .eq('user_id', userId);

    if (error) {
      return Result.fail(new Error(error.message));
    }

    return Result.ok(false);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
  }
};

export interface InspirationRealtimeHandlers {
  readonly onInsert?: (row: InspirationFeedRow) => void;
  readonly onUpdate?: (row: InspirationFeedRow) => void;
}

export const subscribeToInspirationRealtime = (
  handlers: InspirationRealtimeHandlers
): (() => void) => {
  const channel: RealtimeChannel = supabase
    .channel('inspiration-feed-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'provider_portfolios' },
      (payload) => {
        if (!handlers.onInsert) {
          return;
        }
        const portfolioId = typeof payload.new.id === 'string' ? payload.new.id : null;
        if (!portfolioId) {
          return;
        }
        void (async () => {
          const result = await fetchInspirationItemById(portfolioId);
          if (result.isSuccess()) {
            const row = result.getValue();
            if (row) {
              handlers.onInsert(row);
            }
          }
        })();
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'provider_portfolios' },
      (payload) => {
        if (!handlers.onUpdate) {
          return;
        }
        const portfolioId = typeof payload.new.id === 'string' ? payload.new.id : null;
        if (!portfolioId) {
          return;
        }
        void (async () => {
          const result = await fetchInspirationItemById(portfolioId);
          if (result.isSuccess()) {
            const row = result.getValue();
            if (row) {
              handlers.onUpdate(row);
            }
          }
        })();
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
