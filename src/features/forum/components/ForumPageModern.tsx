import { useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  SparklesIcon,
  PhotoIcon,
  TagIcon,
  UserGroupIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

interface PostCardProps {
  post: any;
  index: number;
  viewMode: 'grid' | 'list';
}

const PostCard = memo(({ post, index, viewMode }: PostCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Color schemes for gradient backgrounds
  const gradients = [
    'bg-gradient-to-br from-purple-500 via-pink-500 to-red-500',
    'bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500',
    'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500',
    'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
    'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500',
  ];

  const randomGradient = gradients[index % gradients.length];

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => navigate(`/forum/post/${post.id}`)}
        className="bg-white rounded-2xl p-6 mb-4 cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100"
      >
        <div className="flex gap-4">
          {/* Left side - Avatar and stats */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=6366f1&color=fff`}
              alt={post.username}
              className="w-12 h-12 rounded-full"
            />
            <div className="flex flex-col items-center text-xs text-gray-500">
              <span className="font-semibold">{post.likeCount || 0}</span>
              <span>likes</span>
            </div>
          </div>

          {/* Middle - Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">@{post.username}</span>
                  <span>•</span>
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-xs">
                    {post.categoryName}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-600 line-clamp-2 mb-3">{post.content}</p>
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stats bar */}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {post.commentCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <ArrowPathIcon className="w-4 h-4" />
                {post.repostCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <EyeIcon className="w-4 h-4" />
                {post.viewCount || 0}
              </span>
            </div>
          </div>

          {/* Right side - Image preview */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
              <img
                src={post.mediaUrls[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Grid view (Pinterest style)
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.03 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="relative cursor-pointer group mb-6 break-inside-avoid"
    >
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
        {/* Image or Gradient Background */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
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
            
            {/* Gradient overlay on hover */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                >
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                    <p className="text-sm opacity-90 line-clamp-2">{post.content}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Media type indicator */}
            {post.mediaUrls.length > 1 && (
              <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium flex items-center gap-1">
                <PhotoIcon className="w-3 h-3" />
                {post.mediaUrls.length}
              </div>
            )}
          </div>
        ) : (
          <div className={`relative aspect-[4/5] ${randomGradient} p-8 flex flex-col justify-between`}>
            <div>
              <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-4">
                {post.categoryName}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{post.title}</h3>
              <p className="text-white/90 line-clamp-6 leading-relaxed">{post.content}</p>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content footer */}
        <div className="p-4">
          {/* Author */}
          <div className="flex items-center gap-3 mb-3">
            <img
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=6366f1&color=fff`}
              alt={post.username}
              className="w-8 h-8 rounded-full ring-2 ring-gray-100"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{post.userFullName || post.username}</p>
              <p className="text-xs text-gray-500">@{post.username}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:text-red-500 transition-colors">
                <HeartIcon className="w-4 h-4" />
                {post.likeCount || 0}
              </span>
              <span className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                {post.commentCount || 0}
              </span>
              <span className="flex items-center gap-1 hover:text-green-500 transition-colors">
                <ArrowPathIcon className="w-4 h-4" />
                {post.repostCount || 0}
              </span>
            </div>
            <span className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              {post.viewCount || 0}
            </span>
          </div>
        </div>

        {/* Quick Actions (visible on hover) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 flex flex-col gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all"
              >
                <HeartIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all"
              >
                <BookmarkIcon className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-green-500 hover:text-white transition-all"
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
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
    if (!isFetching && posts.length >= 30) {
      setOffset((prev) => prev + 30);
    }
  }, [isFetching, posts.length]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Modern Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                  <UserGroupIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Community Forum</h1>
                  <p className="text-xs text-gray-500">Share, discuss, connect</p>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100/80 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-gray-100/80 rounded-xl">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-64 placeholder-gray-500"
                />
                <kbd className="px-2 py-0.5 bg-white rounded text-xs text-gray-500 font-mono">⌘K</kbd>
              </div>

              {/* Notifications */}
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <BellIcon className="w-6 h-6 text-gray-700" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </motion.button>
              )}

              {/* Create Post Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Create Post</span>
              </motion.button>
            </div>
          </div>

          {/* Sub-navigation */}
          <div className="flex items-center gap-6 py-3 border-t border-gray-100">
            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('hot')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  sortBy === 'hot' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FireIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Hot</span>
              </button>
              <button
                onClick={() => setSortBy('new')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  sortBy === 'new' 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-sm font-medium">New</span>
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  sortBy === 'top' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Top</span>
              </button>
            </div>

            <div className="h-6 w-px bg-gray-300" />

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => handleCategoryChange(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  currentCategoryId === null
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Topics
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    currentCategoryId === category.id
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ChatBubbleLeftIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                <p className="text-sm text-gray-500">Total Posts</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <HeartIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {posts.reduce((sum, post) => sum + (post.likeCount || 0), 0)}
                </p>
                <p className="text-sm text-gray-500">Total Likes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserGroupIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(posts.map(p => p.userId)).size}
                </p>
                <p className="text-sm text-gray-500">Active Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TagIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading && offset === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full mb-4"
            />
            <p className="text-gray-500">Loading amazing content...</p>
          </div>
        ) : posts.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <Masonry
                breakpointCols={breakpointColumns}
                className="flex -ml-6 w-auto"
                columnClassName="pl-6 bg-clip-padding"
              >
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} viewMode={viewMode} />
                ))}
              </Masonry>
            ) : (
              <div className="max-w-4xl mx-auto">
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} viewMode={viewMode} />
                ))}
              </div>
            )}

            {/* Loading More Indicator */}
            <AnimatePresence>
              {isFetching && offset > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
                    <span className="text-gray-500">Loading more posts...</span>
                  </div>
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
            <div className="inline-flex p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-6">
              <ChatBubbleLeftIcon className="w-16 h-16 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">No posts yet</h2>
            <p className="text-gray-500 mb-8">Be the first to share something amazing!</p>
            <button
              onClick={() => user ? setShowPostForm(true) : navigate('/login')}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {user ? 'Create First Post' : 'Login to Post'}
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

export const ForumPageModern = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
