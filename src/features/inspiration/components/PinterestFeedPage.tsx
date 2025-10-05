import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, HeartIcon, BookmarkIcon, ShareIcon, SparklesIcon, ChartBarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { 
  fetchInspirationFeed, 
  toggleInspirationLikeThunk, 
  toggleInspirationCollectThunk, 
  setInspirationFilters,
  selectAllInspiration,
  selectInspirationPage
} from '../store/inspirationSlice';
import { CarouselModal } from './CarouselModal';
import type { InspirationItem } from '../domain/Inspiration.types';

export const PinterestFeedPage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [selectedItem, setSelectedItem] = useState<InspirationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const items = useAppSelector(selectAllInspiration);
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  const hasMore = true;
  const isLoading = false;
  const filters = { category: '', priceRange: '', sortBy: 'trending' };

  const filteredItems = useMemo(() => {
    if (!searchTerm || !items) return items || [];
    return items.filter((item: InspirationItem) => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, searchTerm]);

  useEffect(() => {
    void dispatch(fetchInspirationFeed({ 
      page: 1,
      filters: {}, 
      sort: 'newest'
    }));
  }, [dispatch]);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && items.length > 0) {
          void dispatch(fetchInspirationFeed({ 
            page: Math.ceil(items.length / 20) + 1,
            filters: {},
            sort: 'newest'
          }));
        }
      },
      { rootMargin: '200px' }
    );

    const node = sentinelRef.current;
    if (node) observer.observe(node);

    return () => observer.disconnect();
  }, [dispatch, hasMore, isLoading, items.length]);

  const handleLike = useCallback((item: InspirationItem) => {
    if (!isAuthenticated) return;
    void dispatch(toggleInspirationLikeThunk(item.id));
  }, [dispatch, isAuthenticated]);

  const handleCollect = useCallback((item: InspirationItem) => {
    if (!isAuthenticated) return;
    void dispatch(toggleInspirationCollectThunk(item.id));
  }, [dispatch, isAuthenticated]);

  const handleShare = useCallback((item: InspirationItem) => {
    if (navigator.share) {
      void navigator.share({
        title: item.title,
        text: item.description || '',
        url: window.location.href,
      });
    }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    // Filter change handler
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('inspiration.search.placeholder')}
                className="search-bar pl-12"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2"
            >
              <FunnelIcon className="w-5 h-5" />
              {t('inspiration.filters.title')}
            </motion.button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4 p-4 bg-gray-50 rounded-2xl"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inspiration.filters.category')}
                    </label>
                    <select
                      value={filters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">{t('inspiration.filters.allCategories')}</option>
                      <option value="sleeproom">{t('inspiration.type.sleeproom')}</option>
                      <option value="kitchen">{t('inspiration.type.kitchen')}</option>
                      <option value="living">{t('inspiration.type.living')}</option>
                      <option value="bathroom">{t('inspiration.type.bathroom')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inspiration.filters.priceRange')}
                    </label>
                    <select
                      value={filters.priceRange || ''}
                      onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">{t('inspiration.filters.anyPrice')}</option>
                      <option value="entry">{t('inspiration.priceRange.entry')}</option>
                      <option value="premium">{t('inspiration.priceRange.premium')}</option>
                      <option value="luxury">{t('inspiration.priceRange.luxury')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('inspiration.filters.sortBy')}
                    </label>
                    <select
                      value={filters.sortBy || 'trending'}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="trending">{t('inspiration.sort.trending')}</option>
                      <option value="newest">{t('inspiration.sort.newest')}</option>
                      <option value="popular">{t('inspiration.sort.popular')}</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                {t('inspiration.hero.title')}
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                {t('inspiration.hero.subtitle')}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <SparklesIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.hero.features.discover')}</h3>
                  <p className="text-gray-600 text-sm">{t('inspiration.hero.features.discoverDesc')}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <ChartBarIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.hero.features.grow')}</h3>
                  <p className="text-gray-600 text-sm">{t('inspiration.hero.features.growDesc')}</p>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <UserGroupIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{t('inspiration.hero.features.connect')}</h3>
                  <p className="text-gray-600 text-sm">{t('inspiration.hero.features.connectDesc')}</p>
                </motion.div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary text-lg px-8 py-4"
                >
                  {t('inspiration.hero.signUp')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  {t('inspiration.hero.learnMore')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredItems.length === 0 && !isLoading ? (
          <div className="text-center py-16">
            <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('inspiration.empty.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('inspiration.empty.subtitle')}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              {t('inspiration.empty.reload')}
            </motion.button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="pin-card break-inside-avoid mb-4 group"
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative">
                <img
                  src={item.heroImage}
                  alt={item.title}
                  className="pin-image"
                  style={{ aspectRatio: 'auto' }}
                />
                <div className="pin-overlay">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCollect(item);
                      }}
                      className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                    >
                      {item.isCollected ? (
                        <BookmarkSolidIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <BookmarkIcon className="w-5 h-5 text-gray-700" />
                      )}
                    </motion.button>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(item);
                          }}
                          className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                        >
                          {item.isLiked ? (
                            <HeartSolidIcon className="w-5 h-5 text-red-500" />
                          ) : (
                            <HeartIcon className="w-5 h-5 text-gray-700" />
                          )}
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                          className="p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors"
                        >
                          <ShareIcon className="w-5 h-5 text-gray-700" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pin-content">
                <h3 className="pin-title">{item.title}</h3>
                {item.description && (
                  <p className="pin-description">{item.description}</p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {item.provider.logoUrl ? (
                      <img
                        src={item.provider.logoUrl}
                        alt={item.provider.companyName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {item.provider.companyName[0]}
                      </div>
                    )}
                    <span className="text-sm text-gray-600 font-medium">
                      {item.provider.companyName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <HeartIcon className="w-4 h-4" />
                      {item.stats.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookmarkIcon className="w-4 h-4" />
                      {item.stats.collects}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-20 flex items-center justify-center">
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full"
            />
          )}
        </div>

        {!hasMore && filteredItems.length > 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('inspiration.loading.end')}</p>
          </div>
        )}
      </div>

      <CarouselModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onCollect={handleCollect}
        onLike={handleLike}
        onFollow={() => {}}
        onShare={handleShare}
        onMessage={() => {}}
      />
    </div>
  );
};
