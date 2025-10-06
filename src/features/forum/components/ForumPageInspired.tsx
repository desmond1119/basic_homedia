import { useEffect, useState, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FeatureErrorBoundary } from '@/shared/components/FeatureErrorBoundary';
import { useGetPostsQuery, useGetCategoriesQuery } from '../api/forumApi';
import { PostFormModal } from './PostFormModal';
import { useAppSelector } from '@/core/store/hooks';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  BookmarkIcon,
  EyeIcon,
  SparklesIcon,
  UserGroupIcon,
  ShareIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

interface PostCardProps {
  post: any;
  index: number;
  onLike: (post: any) => void;
  onBookmark: (post: any) => void;
  onShare: (post: any) => void;
}

const PostCard = memo(({ post, index, onLike, onBookmark, onShare }: PostCardProps) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Color schemes for gradient backgrounds
  const gradients = [
    'from-purple-500 via-pink-500 to-red-500',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-green-500 via-emerald-500 to-teal-500',
    'from-orange-500 via-red-500 to-pink-500',
    'from-indigo-500 via-purple-500 to-pink-500',
    'from-yellow-400 via-orange-500 to-red-500',
  ];

  const randomGradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="pin-card mb-4"
      onClick={() => navigate(`/forum/post/${post.id}`)}
    >
      <div className="relative group">
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="relative">
            <img
              src={post.mediaUrls[0]}
              alt={post.title}
              className="pin-image"
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="w-full h-48 bg-gray-200 animate-pulse" />
            )}
          </div>
        ) : (
          <div className={`w-full h-48 bg-gradient-to-br ${randomGradient} p-6 flex flex-col justify-between`}>
            <div>
              <div className="inline-flex px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-3">
                {post.categoryName}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-3">{post.title}</h3>
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.slice(0, 2).map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="pin-overlay">
          <div className="absolute top-4 right-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(post);
              }}
              className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
            >
              {post.isBookmarked ? (
                <BookmarkSolid className="w-5 h-5 text-blue-500" />
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
                  onLike(post);
                }}
                className="flex items-center gap-1 px-3 py-2 bg-white/90 rounded-full shadow-lg backdrop-blur-sm"
              >
                {post.isLiked ? (
                  <HeartSolid className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4 text-gray-700" />
                )}
                <span className="text-sm font-medium text-gray-700">{post.likeCount || 0}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(post);
                }}
                className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm"
              >
                <ShareIcon className="w-4 h-4 text-gray-700" />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full backdrop-blur-sm">
                <ChatBubbleLeftIcon className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-gray-600">{post.commentCount || 0}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-white/90 rounded-full backdrop-blur-sm">
                <EyeIcon className="w-3 h-3 text-gray-600" />
                <span className="text-xs text-gray-600">{post.viewCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pin-content">
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <h3 className="pin-title">{post.title}</h3>
        )}
        <p className="pin-description line-clamp-2">{post.content}</p>
        
        {post.tags && post.tags.length > 0 && (
          <div className="pin-tags">
            {post.tags.slice(0, 3).map((tag: string, i: number) => (
              <span key={i} className="pin-tag">#{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <img
              src={post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=6366f1&color=fff`}
              alt={post.username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-gray-600 font-medium">{post.username}</span>
          </div>
          <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
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
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll
  useEffect(() => {
    if (!posts.length || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
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
  }, [loadMore, posts.length, isLoading]);

  const handleLike = useCallback((post: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // TODO: Implement like functionality
    console.log('Like post:', post.id);
  }, [user, navigate]);

  const handleBookmark = useCallback((post: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // TODO: Implement bookmark functionality
    console.log('Bookmark post:', post.id);
  }, [user, navigate]);

  const handleShare = useCallback((post: any) => {
    const shareData = {
      title: post.title,
      text: post.content,
      url: `${window.location.origin}/forum/post/${post.id}`,
    };
    if (navigator.share) {
      void navigator.share(shareData).catch(() => {});
      return;
    }
    void navigator.clipboard.writeText(shareData.url).catch(() => {});
  }, []);

  const filteredPosts = posts.filter((post: any) => {
    if (!searchTerm) return true;
    return post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
           post.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            <ChatBubbleLeftIcon className="inline w-12 h-12 text-primary-500 mr-3" />
            Community Forum
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-2xl mx-auto"
          >
            Share ideas, ask questions, and connect with our community
          </motion.p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <ChatBubbleLeftIcon className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Total Posts</h3>
            <p className="text-2xl font-bold text-primary-500">{posts.length}</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <HeartIcon className="w-8 h-8 text-red-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Total Likes</h3>
            <p className="text-2xl font-bold text-primary-500">
              {posts.reduce((sum, post) => sum + (post.likeCount || 0), 0)}
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <UserGroupIcon className="w-8 h-8 text-green-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Active Users</h3>
            <p className="text-2xl font-bold text-primary-500">
              {new Set(posts.map(p => p.userId)).size}
            </p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <TagIcon className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Categories</h3>
            <p className="text-2xl font-bold text-primary-500">{categories.length}</p>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search posts, tags, or content..."
              className="search-bar pl-12"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center gap-2"
          >
            <FunnelIcon className="w-5 h-5" />
            Filters
          </button>
          <button
            onClick={() => user ? setShowPostForm(true) : navigate('/login')}
            className="btn-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Post
          </button>
        </div>

        {/* Category Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`px-4 py-2 rounded-full border transition-colors text-sm ${
                    currentCategoryId === null
                      ? 'border-primary-300 bg-primary-50 text-primary-600'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  All Topics
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-full border transition-colors text-sm flex items-center gap-2 ${
                      currentCategoryId === category.id
                        ? 'border-primary-300 bg-primary-50 text-primary-600'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                    }`}
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Posts Grid */}
        <div className="pin-grid">
          {filteredPosts.map((post: any, index: number) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-primary-200 border-t-primary-500 rounded-full"
            />
          </div>
        )}

        {/* Load More */}
        {!isLoading && posts.length > 0 && posts.length >= 30 && (
          <div className="flex justify-center py-8">
            <button
              onClick={loadMore}
              className="btn-primary flex items-center gap-2"
              disabled={isFetching}
            >
              <SparklesIcon className="w-5 h-5" />
              {isFetching ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchTerm ? 'No posts found' : 'No posts yet'}
            </h2>
            <p className="text-gray-500 mb-8">
              {searchTerm 
                ? 'Try adjusting your search terms or filters'
                : 'Be the first to share something amazing!'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="btn-primary"
              >
                {user ? 'Create First Post' : 'Login to Post'}
              </button>
            )}
          </motion.div>
        )}

        <div ref={sentinelRef} className="h-4" />
      </motion.div>

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

export const ForumPageInspired = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
