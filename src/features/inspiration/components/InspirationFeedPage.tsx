import { useCallback, useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, HeartIcon, BookmarkIcon, ShareIcon, SparklesIcon, TrendingUpIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchInspirations, toggleLike, toggleCollect, setFilters, clearFilters } from '../store/inspirationSlice';
import { CarouselModal } from './CarouselModal';
import type { InspirationItem, InspirationFilters } from '../domain/Inspiration.types';
import {
  selectInspirationOrder,
  selectInspirationPage,
  selectInspirationSortState,
  setInspirationFilters,
  setInspirationSort,
  toggleInspirationCollectThunk,
  toggleInspirationFollowThunk,
  toggleInspirationLikeThunk,
  upsertInspirationItem,
} from '../store/inspirationSlice';
import type {
  InspirationFilterState,
  InspirationItem,
  InspirationSortOption,
} from '../domain/Inspiration.types';
import { InspirationCard } from './InspirationCard';
import { CarouselModal } from './CarouselModal';
import { InspirationRepository } from '../infrastructure/InspirationRepository';

const typeOptions: readonly { value: string; labelKey: string }[] = [
  { value: 'sleeproom', labelKey: 'inspiration.type.sleeproom' },
  { value: 'kitchen', labelKey: 'inspiration.type.kitchen' },
  { value: 'living', labelKey: 'inspiration.type.living' },
  { value: 'bathroom', labelKey: 'inspiration.type.bathroom' },
];

const locationOptions: readonly { value: string; labelKey: string }[] = [
  { value: 'HK', labelKey: 'inspiration.location.hk' },
  { value: 'UK', labelKey: 'inspiration.location.uk' },
  { value: 'SG', labelKey: 'inspiration.location.sg' },
];

const priceOptions: readonly {
  value: string;
  labelKey: string;
  min: number | undefined;
  max: number | undefined;
}[] = [
  { value: 'entry', labelKey: 'inspiration.priceRange.entry', min: 0, max: 50000 },
  { value: 'premium', labelKey: 'inspiration.priceRange.premium', min: 50000, max: 150000 },
  { value: 'luxury', labelKey: 'inspiration.priceRange.luxury', min: 150000, max: undefined },
];

const ratingOptions: readonly number[] = [4.5, 4.8, 5];
const sortOptions: readonly { value: InspirationSortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'inspiration.sort.newest' },
  { value: 'popular', labelKey: 'inspiration.sort.popular' },
  { value: 'personalized', labelKey: 'inspiration.sort.personalized' },
];
const tagPresets: readonly string[] = ['minimal', 'luxury', 'eco', 'smart'];
const repository = new InspirationRepository();

const matchesFilters = (item: InspirationItem, filters: InspirationFilterState): boolean => {
  if (filters.type && item.projectType !== filters.type) {
    return false;
  }
  if (filters.location && item.location !== filters.location) {
    return false;
  }
  if (filters.priceMin !== undefined) {
    if (item.priceMin === null || item.priceMin < filters.priceMin) {
      return false;
    }
  }
  if (filters.priceMax !== undefined) {
    if (item.priceMax === null || item.priceMax > filters.priceMax) {
      return false;
    }
  }
  if (filters.ratingMin !== undefined && item.provider.rating < filters.ratingMin) {
    return false;
  }
  if (filters.tag) {
    const needle = filters.tag.toLowerCase();
    const tagMatch = item.tags.some((tag) => tag.toLowerCase().includes(needle));
    if (!tagMatch) {
      const titleMatch = item.title.toLowerCase().includes(needle);
      const descriptionMatch = (item.description ?? '').toLowerCase().includes(needle);
      if (!titleMatch && !descriptionMatch) {
        return false;
      }
    }
  }
  return true;
};

export const InspirationFeedPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const sort = useAppSelector(selectInspirationSortState);
  const filters = useAppSelector(selectInspirationFilters);
  const order = useAppSelector((state) => selectInspirationOrder(state, sort));
  const entities = useAppSelector(selectInspirationEntities);
  const hasMore = useAppSelector((state) => selectInspirationHasMore(state, sort));
  const page = useAppSelector((state) => selectInspirationPage(state, sort));
  const fetchState = useAppSelector(selectInspirationFetchState);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const userId = useAppSelector((state) => state.auth.user?.id ?? null);

  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState(filters.tag ?? '');
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo(() => {
    return order
      .map((id) => entities[id])
      .filter((entry): entry is InspirationItem => Boolean(entry));
  }, [entities, order]);

  useEffect(() => {
    setSearchTerm(filters.tag ?? '');
  }, [filters.tag]);

  useEffect(() => {
    if (order.length === 0 && fetchState.status !== 'pending') {
      void dispatch(
        fetchInspirationFeed({
          page: 0,
          filters,
          sort,
          userId: userId ?? undefined,
          reset: true,
        })
      );
    }
  }, [dispatch, fetchState.status, filters, order.length, sort, userId]);

  useEffect(() => {
    if (!hasMore) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting || fetchState.status === 'pending') {
          return;
        }
        void dispatch(
          fetchInspirationFeed({
            page,
            filters,
            sort,
            userId: userId ?? undefined,
          })
        );
      },
      { rootMargin: '320px 0px 320px 0px', threshold: 0.1 }
    );

    const node = sentinelRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
    };
  }, [dispatch, fetchState.status, filters, hasMore, page, sort, userId]);

  useEffect(() => {
    const unsubscribe = repository.subscribeToRealtime({
      userId: userId ?? undefined,
      onInsert: (item) => {
        if (matchesFilters(item, filters)) {
          dispatch(upsertInspirationItem(item));
        }
      },
      onUpdate: (item) => {
        if (matchesFilters(item, filters)) {
          dispatch(upsertInspirationItem(item));
        }
      },
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, filters, userId]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }
    const latest = entities[selectedItem.id];
    if (latest && latest !== selectedItem) {
      setSelectedItem(latest);
    }
  }, [entities, selectedItem]);

  const ensureAuthenticated = useCallback(() => {
    if (isAuthenticated && userId) {
      return true;
    }
    navigate('/login');
    return false;
  }, [isAuthenticated, navigate, userId]);

  const handleCollect = useCallback(
    (item: InspirationItem) => {
      if (!ensureAuthenticated()) {
        return;
      }
      if (!userId) {
        return;
      }
      const shouldCollect = !item.isCollected;
      dispatch(
        markInspirationInteraction({
          id: item.id,
          collected: shouldCollect,
          collectDelta: shouldCollect ? 1 : -1,
        })
      );
      void dispatch(
        toggleInspirationCollectThunk({
          id: item.id,
          userId,
          shouldCollect,
        })
      );
    },
    [dispatch, ensureAuthenticated, userId]
  );

  const handleLike = useCallback(
    (item: InspirationItem) => {
      if (!ensureAuthenticated()) {
        return;
      }
      if (!userId) {
        return;
      }
      const shouldLike = !item.isLiked;
      dispatch(
        markInspirationInteraction({
          id: item.id,
          liked: shouldLike,
          likeDelta: shouldLike ? 1 : -1,
        })
      );
      void dispatch(
        toggleInspirationLikeThunk({
          id: item.id,
          userId,
          shouldLike,
        })
      );
    },
    [dispatch, ensureAuthenticated, userId]
  );

  const handleFollow = useCallback(
    (item: InspirationItem) => {
      if (!ensureAuthenticated()) {
        return;
      }
      if (!userId) {
        return;
      }
      const shouldFollow = !item.provider.isFollowing;
      dispatch(
        markInspirationInteraction({
          id: item.id,
          following: shouldFollow,
        })
      );
      void dispatch(
        toggleInspirationFollowThunk({
          providerId: item.provider.id,
          userId,
          shouldFollow,
        })
      );
    },
    [dispatch, ensureAuthenticated, userId]
  );

  const handleShare = useCallback((item: InspirationItem) => {
    const shareUrl = `${window.location.origin}/providers/${item.providerId}?portfolio=${item.id}`;
    const shareData: ShareData = {
      title: item.title,
      text: item.description ?? '',
      url: shareUrl,
    };

    const share = async () => {
      try {
        if (typeof navigator.share === 'function') {
          await navigator.share(shareData);
          return;
        }
        if ('clipboard' in navigator) {
          await navigator.clipboard.writeText(shareUrl);
        }
      } catch (error) {
        console.error('Failed to share inspiration', error);
      }
    };

    void share();
  }, []);

  const handleMessage = useCallback(
    (item: InspirationItem) => {
      if (!ensureAuthenticated()) {
        return;
      }
      navigate(`/messages?provider=${item.provider.id}`);
    },
    [ensureAuthenticated, navigate]
  );

  const applyFilters = useCallback(
    (patch: Partial<InspirationFilterState>) => {
      const next: InspirationFilterState = {
        ...filters,
        ...patch,
      };
      dispatch(setInspirationFilters(next));
    },
    [dispatch, filters]
  );

  const handleTypeSelect = (value: string) => {
    applyFilters({ type: filters.type === value ? undefined : value });
  };

  const handleLocationSelect = (value: string) => {
    applyFilters({ location: filters.location === value ? undefined : value });
  };

  const handlePriceSelect = (option: (typeof priceOptions)[number]) => {
    const isActive = filters.priceMin === option.min && filters.priceMax === option.max;
    applyFilters({
      priceMin: isActive ? undefined : option.min,
      priceMax: isActive ? undefined : option.max,
    });
  };

  const handleRatingSelect = (threshold: number) => {
    applyFilters({ ratingMin: filters.ratingMin === threshold ? undefined : threshold });
  };

  const handleTagSubmit = (value: string) => {
    const trimmed = value.trim();
    applyFilters({ tag: trimmed ? trimmed : undefined });
  };

  const handleSortChange = (nextSort: InspirationSortOption) => {
    dispatch(setInspirationSort(nextSort));
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const themeClass = isDark ? 'bg-black text-white' : 'bg-white text-gray-900';

  return (
    <div className={`min-h-screen ${themeClass} transition-colors duration-500`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pb-24 pt-16 md:px-8">
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-gray-900 to-gray-950 p-10 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 flex flex-col gap-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.6em] text-white/50">
                  {t('inspiration.hero.tagline')}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                  {t('inspiration.hero.title')}
                </h1>
                <p className="max-w-2xl text-sm text-white/70 md:text-base">
                  {t('inspiration.hero.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
              >
                {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                {isDark ? t('inspiration.actions.lightMode') : t('inspiration.actions.darkMode')}
              </button>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex flex-1 items-center">
                <MagnifyingGlassIcon className="absolute left-4 h-5 w-5 text-white/40" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleTagSubmit((event.target as HTMLInputElement).value);
                    }
                  }}
                  placeholder={t('inspiration.search.placeholder')}
                  className="w-full rounded-full border border-white/10 bg-white/10 py-3 pl-12 pr-4 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/20"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      handleTagSubmit('');
                    }}
                    className="absolute right-4 text-[10px] uppercase tracking-[0.4em] text-white/60"
                  >
                    {t('inspiration.actions.clear')}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  handleTagSubmit(searchTerm);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-black transition hover:bg-white/90"
              >
                <FunnelIcon className="h-5 w-5" />
                {t('inspiration.actions.searchTags')}
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {tagPresets.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    handleTagSubmit(tag);
                  }}
                  className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] transition ${
                    filters.tag === tag ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </motion.div>

          <div className="pointer-events-none absolute -right-28 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-white/10 blur-3xl md:block" />
        </header>

        <section className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <aside className="space-y-6">
            <FilterGroup
              title={t('inspiration.filter.type')}
              options={typeOptions}
              selectedValue={filters.type}
              onSelect={handleTypeSelect}
              t={t}
            />

            <FilterGroup
              title={t('inspiration.filter.location')}
              options={locationOptions}
              selectedValue={filters.location}
              onSelect={handleLocationSelect}
              t={t}
            />

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                {t('inspiration.filter.price')}
              </h3>
              <div className="flex flex-col gap-2">
                {priceOptions.map((option) => {
                  const isActive = filters.priceMin === option.min && filters.priceMax === option.max;
                  return (
                    <button
                      key={option.value}
                      type="button"
                    onClick={() => {
                      handlePriceSelect(option);
                    }}
                      className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] transition ${
                        isActive ? 'bg-white text-black' : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                {t('inspiration.filter.rating')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {ratingOptions.map((threshold) => (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => {
                      handleRatingSelect(threshold);
                    }}
                    className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] transition ${
                      filters.ratingMin === threshold
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {t('inspiration.filter.ratingValue', { rating: threshold.toFixed(1) })}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      handleSortChange(option.value);
                    }}
                    className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] transition ${
                      sort === option.value
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-[0.4em] text-white/50">
                {t('inspiration.filter.active', { count: items.length })}
              </div>
            </div>

            <motion.div layout className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence>
                {items.map((item) => (
                  <InspirationCard
                    key={item.id}
                    item={item}
                    onCollect={handleCollect}
                    onLike={handleLike}
                    onFollow={handleFollow}
                    onShare={handleShare}
                    onMessage={handleMessage}
                    onOpen={setSelectedItem}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            <div ref={sentinelRef} className="h-32 w-full">
              {fetchState.status === 'pending' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.4em] text-white/60"
                >
                  {t('inspiration.loading.more')}
                </motion.div>
              )}
              {!hasMore && fetchState.status === 'succeeded' && (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.4em] text-white/40">
                  {t('inspiration.loading.end')}
                </div>
              )}
              {items.length === 0 && fetchState.status === 'succeeded' && (
                <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.4em] text-white/60">
                  {t('inspiration.empty')}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <CarouselModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onCollect={handleCollect}
        onLike={handleLike}
        onFollow={handleFollow}
        onShare={handleShare}
        onMessage={handleMessage}
      />
    </div>
  );
};

interface FilterOption {
  readonly value: string;
  readonly labelKey: string;
}

interface FilterGroupProps {
  readonly title: string;
  readonly options: readonly FilterOption[];
  readonly selectedValue?: string;
  readonly onSelect: (value: string) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

const FilterGroup = ({ title, options, selectedValue, onSelect, t }: FilterGroupProps) => (
  <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6">
    <h3 className="text-[10px] uppercase tracking-[0.4em] text-white/60">{title}</h3>
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            onSelect(option.value);
          }}
          className={`rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.4em] transition ${
            selectedValue === option.value
              ? 'bg-white text-black'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          {t(option.labelKey)}
        </button>
      ))}
    </div>
  </div>
);
