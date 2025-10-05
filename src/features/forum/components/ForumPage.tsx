import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary';
import { useGetPostsQuery, useGetCategoriesQuery } from '../api/forumApi';
import { PostGrid } from './PostGrid';
import { CategoryNav } from './CategoryNav';
import { PostFormModal } from './PostFormModal';
import { PlusIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

const ForumPageContent = memo(() => {
  const { t } = useTranslation();
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: posts = [], isLoading, isFetching } = useGetPostsQuery({
    categoryId: currentCategoryId || undefined,
    limit: 20,
    offset,
  });

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
    setOffset(0);
  }, []);

  const loadMore = useCallback(() => {
    if (!isFetching) {
      setOffset((prev) => prev + 20);
    }
  }, [isFetching]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <div className="min-h-screen bg-black font-['Inter']">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/80 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <h1 className="text-3xl font-bold text-white">{t('forum.title')}</h1>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full">
                <span className="text-gray-400 text-sm">{posts.length}</span>
                <span className="text-gray-600 text-sm">{t('forum.stats.posts')}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="hidden md:flex items-center gap-1 bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPostForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{t('forum.newPost')}</span>
              </motion.button>
            </motion.div>
          </div>

          <CategoryNav
            categories={categories}
            currentCategoryId={currentCategoryId}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
            />
          </div>
        ) : (
          <>
            <PostGrid posts={posts} viewMode={viewMode} />

            <AnimatePresence>
              {isFetching && offset > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {posts.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-400 text-lg mb-2">{t('forum.noPosts')}</p>
                <p className="text-gray-600 text-sm">{t('forum.beFirst')}</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showPostForm && (
          <PostFormModal
            onClose={() => setShowPostForm(false)}
            categoryId={currentCategoryId || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
});

ForumPageContent.displayName = 'ForumPageContent';

export const ForumPage = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
