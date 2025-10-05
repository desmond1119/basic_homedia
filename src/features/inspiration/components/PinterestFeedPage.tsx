import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { 
  fetchInspirationFeed, 
  toggleInspirationLikeThunk, 
  toggleInspirationCollectThunk, 
  toggleInspirationFollowThunk,
  selectAllInspiration,
  selectInspirationPage,
  selectInspirationHasMore,
  selectInspirationSortState,
  selectInspirationFilters,
  selectInspirationFetchState
} from '../store/inspirationSlice';
import { CarouselModal } from './CarouselModal';
import type { InspirationItem } from '../domain/Inspiration.types';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  SparklesIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  BookmarkIcon,
  HeartIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon,
  HeartIcon as HeartSolidIcon
} from '@heroicons/react/24/solid';

export const PinterestFeedPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const authUser = useAppSelector((state) => state.auth.user);
  const filters = useAppSelector(selectInspirationFilters);
  const sort = useAppSelector(selectInspirationSortState);
  const fetchState = useAppSelector(selectInspirationFetchState);
  const hasMore = useAppSelector((state) => selectInspirationHasMore(state, sort));
  const currentPage = useAppSelector((state) => selectInspirationPage(state, sort));
  const items = useAppSelector(selectAllInspiration);

  const isLoading = fetchState.status === 'pending';

  useEffect(() => {
    if (items.length === 0 && fetchState.status === 'idle') {
      void dispatch(
        fetchInspirationFeed({
          page: 1,
          filters,
          sort,
          reset: true,
        })
      );
    }
  }, [dispatch, items.length, filters, sort, fetchState.status]);

  useEffect(() => {
    if (!hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          const nextPage = currentPage + 1;
          void dispatch(
            fetchInspirationFeed({
              page: nextPage,
              filters,
              sort,
            })
          );
        }
      },
      { rootMargin: '200px' }
    );

    const node = sentinelRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
    };
  }, [dispatch, filters, sort, currentPage, hasMore, isLoading]);

  const handleLike = useCallback(
    (item: InspirationItem) => {
      if (!authUser) {
        return;
      }
      void dispatch(
        toggleInspirationLikeThunk({
          id: item.id,
          userId: authUser.id,
          shouldLike: !item.isLiked,
        })
      );
    },
    [authUser, dispatch]
  );

  const handleCollect = useCallback(
    (item: InspirationItem) => {
      if (!authUser) {
        return;
      }
      void dispatch(
        toggleInspirationCollectThunk({
          id: item.id,
          userId: authUser.id,
          shouldCollect: !item.isCollected,
        })
      );
    },
    [authUser, dispatch]
  );

  const handleFollow = useCallback(
    (item: InspirationItem) => {
      if (!authUser) {
        return;
      }
      void dispatch(
        toggleInspirationFollowThunk({
          providerId: item.provider.id,
          userId: authUser.id,
          shouldFollow: !item.provider.isFollowing,
        })
      );
    },
    [authUser, dispatch]
  );

  const handleShare = useCallback(
    (item: InspirationItem) => {
      const shareData = {
        title: item.title,
        text: item.description ?? '',
        url: `${window.location.origin}/inspiration/${item.id}`,
      };
      if (navigator.share) {
        void navigator.share(shareData).catch(() => {});
        return;
      }
      void navigator.clipboard.writeText(shareData.url).catch(() => {});
    },
    []
  );

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item: InspirationItem) => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            <SparklesIcon className="inline w-12 h-12 text-primary-500 mr-3" />
            {t('inspiration.hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            {t('inspiration.hero.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <SparklesIcon className="w-8 h-8 text-accent-pink mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.stats.trending')}</h3>
            <p className="text-2xl font-bold text-primary-500">2.4K</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <ChartBarIcon className="w-8 h-8 text-accent-blue mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.stats.views')}</h3>
            <p className="text-2xl font-bold text-primary-500">15.2K</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <UserGroupIcon className="w-8 h-8 text-accent-green mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.stats.creators')}</h3>
            <p className="text-2xl font-bold text-primary-500">340</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <HeartIcon className="w-8 h-8 text-accent-orange mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.stats.likes')}</h3>
            <p className="text-2xl font-bold text-primary-500">8.7K</p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('inspiration.search.placeholder')}
              className="search-bar pl-12"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <FunnelIcon className="w-5 h-5" />
            {t('inspiration.filters.title')}
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                {['Modern', 'Minimalist', 'Industrial', 'Scandinavian', 'Bohemian', 'Traditional'].map((filter) => (
                  <button
                    key={filter}
                    className="px-4 py-2 rounded-full border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-sm"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pin-grid">
          {filteredItems.map((item: InspirationItem, index: number) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="pin-card mb-4"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative group">
                <img
                  src={item.heroImage}
                  alt={item.title}
                  className="pin-image"
                  loading="lazy"
                />
                
                <div className="pin-overlay">
                  <div className="absolute top-4 right-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCollect(item);
                      }}
                      className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
                    >
                      {item.isCollected ? (
                        <BookmarkSolidIcon className="w-5 h-5 text-primary-500" />
                      ) : (
                        <BookmarkIcon className="w-5 h-5 text-gray-700" />
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item);
                        }}
                        className="flex items-center gap-1 px-3 py-2 bg-white/90 rounded-full shadow-lg backdrop-blur-sm"
                      >
                        {item.isLiked ? (
                          <HeartSolidIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <HeartIcon className="w-4 h-4 text-gray-700" />
                        )}
                        <span className="text-sm font-medium text-gray-700">{item.stats.likes ?? 0}</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(item);
                        }}
                        className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
                      >
                        <ShareIcon className="w-4 h-4 text-gray-700" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pin-content">
                <h3 className="pin-title">{item.title}</h3>
                {item.description && <p className="pin-description">{item.description}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full"
            />
          </div>
        )}

        {hasMore && !isLoading && (
          <div className="flex justify-center py-8">
            <button
              onClick={() => {
                const nextPage = currentPage + 1;
                void dispatch(
                  fetchInspirationFeed({
                    page: nextPage,
                    filters,
                    sort,
                  })
                );
              }}
              className="btn-primary flex items-center gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              {t('inspiration.loadMore')}
            </button>
          </div>
        )}

        <div ref={sentinelRef} className="h-4" />
      </motion.div>

      <AnimatePresence>
        {selectedItem && (
          <CarouselModal
            item={selectedItem}
            isOpen={Boolean(selectedItem)}
            onClose={() => setSelectedItem(null)}
            onCollect={handleCollect}
            onLike={handleLike}
            onFollow={handleFollow}
            onShare={handleShare}
            onMessage={() => {}}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
