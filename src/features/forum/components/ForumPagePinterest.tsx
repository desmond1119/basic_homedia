import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary';
import { useGetPostsQuery, useGetCategoriesQuery } from '../api/forumApi';
import { PostFormModal } from './PostFormModal';
import { useAppSelector } from '@/core/store/hooks';
// @ts-ignore
import Masonry from 'react-masonry-css';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  ArrowPathIcon,
  BookmarkIcon,
  EyeIcon,
  FireIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

interface PostCardProps {
  post: any;
  index: number;
}

const PostCard = memo(({ post, index }: PostCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Random heights for Pinterest-style layout
  const cardHeights = ['h-64', 'h-72', 'h-80', 'h-96', 'h-[28rem]'];
  const randomHeight = cardHeights[Math.floor(Math.random() * cardHeights.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="relative cursor-pointer group mb-4 break-inside-avoid"
    >
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300">
        {/* Image or Gradient Background */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className={`relative ${randomHeight} overflow-hidden bg-gray-100`}>
            <img
              src={post.mediaUrls[0]}
              alt={post.title}
              className={`w-full h-full object-cover transition-all duration-700 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            
            {/* Overlay on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                />
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className={`relative ${randomHeight} bg-gradient-to-br ${
            ['from-red-400 to-pink-500', 'from-blue-400 to-indigo-500', 'from-green-400 to-teal-500',
             'from-purple-400 to-pink-500', 'from-yellow-400 to-orange-500'][index % 5]
          } p-6 flex items-center justify-center`}>
            <div className="text-white text-center">
              <h3 className="text-xl font-bold mb-2 line-clamp-3">{post.title}</h3>
              <p className="text-white/80 text-sm line-clamp-2">{post.content}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
              {post.categoryName}
            </span>
            {post.tags && post.tags.length > 0 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{post.tags[0]}
              </span>
            )}
          </div>

          {/* Title */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
              {post.title}
            </h3>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 mb-3">
            <img
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=ef4444&color=fff`}
              alt={post.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-600">{post.username}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <HeartIcon className="w-4 h-4" />
                {post.likeCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {post.commentCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {post.viewCount || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions (visible on hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-4 right-4 flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all"
              >
                <HeartIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all"
              >
                <BookmarkIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-green-500 hover:text-white transition-all"
              >
                <ArrowPathIcon className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

PostCard.displayName = 'PostCard';

const ForumPageContent = memo(() => {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: posts = [], isLoading, isFetching } = useGetPostsQuery({
    categoryId: currentCategoryId || undefined,
    limit: 30,
    offset,
  });

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
    setOffset(0);
  }, []);

  const loadMore = useCallback(() => {
    if (!isFetching) {
      setOffset((prev) => prev + 30);
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

  // Masonry breakpoints
  const breakpointColumns = {
    default: 5,
    1536: 4,
    1280: 3,
    1024: 2,
    768: 2,
    640: 1
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                Forum
              </h1>
              
              {/* Sort Tabs */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    sortBy === 'hot' 
                      ? 'bg-white text-red-500 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FireIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Hot</span>
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    sortBy === 'new' 
                      ? 'bg-white text-blue-500 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">New</span>
                </button>
                <button
                  onClick={() => setSortBy('top')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    sortBy === 'top' 
                      ? 'bg-white text-green-500 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ArrowTrendingUpIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Top</span>
                </button>
              </div>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('forum.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-64"
                />
              </div>

              {/* Notifications */}
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <BellIcon className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </motion.button>
              )}

              {/* Create Post Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPostForm(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">{t('forum.newPost')}</span>
              </motion.button>
            </div>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                currentCategoryId === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  currentCategoryId === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
            />
          </div>
        ) : posts.length > 0 ? (
          <>
            <Masonry
              breakpointCols={breakpointColumns}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {posts.map((post, index) => (
                <PostCard key={post.id} post={post} index={index} />
              ))}
            </Masonry>

            {/* Loading More Indicator */}
            <AnimatePresence>
              {isFetching && offset > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-red-500 rounded-full animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-500 text-lg mb-2">{t('forum.noPosts')}</p>
            <p className="text-gray-400 text-sm mb-6">{t('forum.beFirst')}</p>
            <button
              onClick={() => setShowPostForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {t('forum.createFirstPost')}
            </button>
          </motion.div>
        )}
      </div>

      {/* Post Form Modal */}
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

export const ForumPagePinterest = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
