// Mobbin-style forum page with dark theme and animations
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchCategories, fetchPosts, setCurrentCategory, resetPosts } from '../store/forumSlice';
import { PostCardMobbin } from './PostCardMobbin';
import { PostFormModal } from './PostFormModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export const ForumPageMobbin = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { categories, posts, currentCategoryId, hasMore, fetchPosts: fetchPostsState } = useAppSelector((state) => state.forum);
  const [showPostForm, setShowPostForm] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    void dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    void dispatch(fetchPosts({ categoryId: currentCategoryId || undefined, limit: 20, offset: 0 }));
    setOffset(0);
  }, [dispatch, currentCategoryId]);

  const handleCategoryChange = (categoryId: string | null) => {
    dispatch(setCurrentCategory(categoryId));
    dispatch(resetPosts());
  };

  const loadMore = useCallback(() => {
    if (hasMore && fetchPostsState.status !== 'pending') {
      const newOffset = offset + 20;
      setOffset(newOffset);
      void dispatch(fetchPosts({ categoryId: currentCategoryId || undefined, limit: 20, offset: newOffset }));
    }
  }, [dispatch, currentCategoryId, hasMore, offset, fetchPostsState.status]);

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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-20 glass-card border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold text-white"
            >
              {t('forum.title')}
            </motion.h1>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPostForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              {t('forum.newPost')}
            </motion.button>
          </div>

          {/* Category tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-4 scrollbar-hide">
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleCategoryChange(null)}
              className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                currentCategoryId === null
                  ? 'bg-white text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {t('forum.categories.all')}
            </motion.button>
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-6 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                  currentCategoryId === category.id
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Posts feed */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {fetchPostsState.status === 'pending' && offset === 0 ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
            />
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {posts.map((post, index) => (
                <PostCardMobbin key={post.id} post={post} index={index} />
              ))}
            </div>

            {fetchPostsState.status === 'pending' && offset > 0 && (
              <div className="flex justify-center py-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full"
                />
              </div>
            )}

            {!hasMore && posts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-shallow"
              >
                {t('common.reachedEnd')}
              </motion.div>
            )}

            {posts.length === 0 && fetchPostsState.status !== 'pending' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="text-6xl mb-4">📝</div>
                <p className="text-shallow text-lg">{t('forum.comment.noComments')}</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Post form modal */}
      {showPostForm && (
        <PostFormModal
          onClose={() => setShowPostForm(false)}
          categoryId={currentCategoryId || undefined}
        />
      )}
    </div>
  );
};
