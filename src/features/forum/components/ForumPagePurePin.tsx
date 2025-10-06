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
  ChatBubbleLeftIcon,
  HeartIcon,
  BookmarkIcon,
  EyeIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

interface PostPinProps {
  post: any;
  index: number;
  onLike: (post: any) => void;
  onBookmark: (post: any) => void;
  onShare: (post: any) => void;
}

const PostPin = memo(({ post, index, onLike, onBookmark, onShare }: PostPinProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Pinterest-style gradient backgrounds for text posts
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];

  const randomGradient = gradients[index % gradients.length];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      className="pin-card group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/forum/post/${post.id}`)}
    >
      <div className="relative overflow-hidden">
        {/* Image or Gradient Background */}
        {post.mediaUrls && post.mediaUrls.length > 0 ? (
          <div className="relative">
            <img
              src={post.mediaUrls[0]}
              alt={post.title}
              className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ aspectRatio: 'auto' }}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="w-full h-64 bg-gray-200 animate-pulse" />
            )}
          </div>
        ) : (
          <div 
            className="w-full min-h-[200px] p-6 flex flex-col justify-between text-white relative"
            style={{ 
              background: randomGradient,
              aspectRatio: Math.random() > 0.5 ? '3/4' : '4/5'
            }}
          >
            <div>
              <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium mb-4">
                {post.categoryName}
              </div>
              <h3 className="text-xl font-bold mb-3 leading-tight">{post.title}</h3>
              <p className="text-sm opacity-90 line-clamp-4">{post.content}</p>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Actions */}
              <div className="flex justify-between items-start">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(post);
                  }}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  {post.isBookmarked ? (
                    <BookmarkSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <BookmarkIcon className="w-5 h-5 text-gray-700" />
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                >
                  <EllipsisHorizontalIcon className="w-5 h-5 text-gray-700" />
                </motion.button>
              </div>

              {/* Bottom Actions */}
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike(post);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
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
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <ShareIcon className="w-4 h-4 text-gray-700" />
                  </motion.button>
                </div>

                <div className="flex items-center gap-2 text-white text-sm">
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>{post.commentCount || 0}</span>
                  <EyeIcon className="w-4 h-4 ml-2" />
                  <span>{post.viewCount || 0}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Post Info */}
      <div className="p-4">
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <>
            <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">{post.title}</h3>
            <p className="text-gray-600 text-xs line-clamp-2 mb-3">{post.content}</p>
          </>
        )}
        
        {/* Author Info */}
        <div className="flex items-center gap-2">
          {post.userAvatar ? (
            <img
              src={post.userAvatar}
              alt={post.username}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-gray-500" />
            </div>
          )}
          <span className="text-xs text-gray-600 font-medium">{post.username}</span>
        </div>
      </div>
    </motion.div>
  );
});

PostPin.displayName = 'PostPin';

const ForumPageContent = memo(() => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offset, setOffset] = useState(0);
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
    if (!searchQuery) return true;
    return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Pinterest-style Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Forum</h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-8 ml-8">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`text-base font-medium transition-colors ${
                    currentCategoryId === null
                      ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Home
                </button>
                {categories.slice(0, 4).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`text-base font-medium transition-colors ${
                      currentCategoryId === category.id
                        ? 'text-gray-900 border-b-2 border-gray-900 pb-1'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-3 bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-gray-200 transition-all"
                />
              </div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                Create
              </motion.button>

              {/* Profile */}
              {user && (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-gray-600" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Pills (Mobile) */}
        <div className="md:hidden mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
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
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  currentCategoryId === category.id
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading && offset === 0 ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full"
            />
          </div>
        ) : filteredPosts.length > 0 ? (
          <>
            <div className="pin-grid">
              {filteredPosts.map((post: any, index: number) => (
                <PostPin
                  key={post.id}
                  post={post}
                  index={index}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Loading More */}
            <AnimatePresence>
              {isFetching && offset > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-center py-8"
                >
                  <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
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
            <div className="text-6xl mb-4">📌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No posts found' : 'No posts yet'}
            </h2>
            <p className="text-gray-500 mb-8">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Be the first to share something amazing!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="px-8 py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
              >
                {user ? 'Create First Post' : 'Login to Post'}
              </button>
            )}
          </motion.div>
        )}

        <div ref={sentinelRef} className="h-4" />
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

export const ForumPagePurePin = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
