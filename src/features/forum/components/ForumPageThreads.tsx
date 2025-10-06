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
  ArrowPathIcon,
  BookmarkIcon,
  EyeIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  UserIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid
} from '@heroicons/react/24/solid';

interface ThreadPostProps {
  post: any;
  index: number;
  onLike: (post: any) => void;
  onBookmark: (post: any) => void;
  onShare: (post: any) => void;
  onRepost: (post: any) => void;
}

const ThreadPost = memo(({ post, index, onLike, onBookmark, onShare, onRepost }: ThreadPostProps) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      className="bg-white border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
      onClick={() => navigate(`/forum/post/${post.id}`)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="px-4 py-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* User Info */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold text-gray-900 text-sm">{post.username}</span>
              <span className="text-gray-500 text-xs">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              {post.categoryName && (
                <span className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full font-medium">
                  {post.categoryName}
                </span>
              )}
            </div>

            {/* Post Content */}
            <div className="mb-3">
              <h3 className="font-semibold text-gray-900 text-base mb-2 leading-tight">
                {post.title}
              </h3>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="text-red-500 text-sm font-medium hover:text-red-600 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-gray-400 text-sm">+{post.tags.length - 3} more</span>
                )}
              </div>
            )}

            {/* Media */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3">
                {post.mediaUrls.length === 1 ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200">
                    {post.mediaUrls[0].includes('video') ? (
                      <div className="relative">
                        <video
                          src={post.mediaUrls[0]}
                          className="w-full max-h-96 object-cover"
                          controls={false}
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                            <PlayIcon className="w-6 h-6 text-gray-800 ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrls[0]}
                        alt=""
                        className="w-full max-h-96 object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden">
                    {post.mediaUrls.slice(0, 4).map((url: string, i: number) => (
                      <div key={i} className="relative aspect-square">
                        <img
                          src={url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {i === 3 && post.mediaUrls.length > 4 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              +{post.mediaUrls.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Like */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(post);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors"
                >
                  {post.isLiked ? (
                    <HeartSolid className="w-5 h-5 text-red-500" />
                  ) : (
                    <HeartIcon className="w-5 h-5" />
                  )}
                  <span className="text-sm font-medium">{post.likeCount || 0}</span>
                </motion.button>

                {/* Comment */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/forum/post/${post.id}#comments`);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.commentCount || 0}</span>
                </motion.button>

                {/* Repost */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRepost(post);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.repostCount || 0}</span>
                </motion.button>

                {/* Share */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(post);
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-purple-500 transition-colors"
                >
                  <ShareIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                {/* Views */}
                <div className="flex items-center gap-1 text-gray-500">
                  <EyeIcon className="w-4 h-4" />
                  <span className="text-xs">{post.viewCount || 0}</span>
                </div>

                {/* Bookmark */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmark(post);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    post.isBookmarked
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {post.isBookmarked ? (
                    <BookmarkSolid className="w-4 h-4" />
                  ) : (
                    <BookmarkIcon className="w-4 h-4" />
                  )}
                </motion.button>

                {/* More */}
                <AnimatePresence>
                  {showActions && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ThreadPost.displayName = 'ThreadPost';

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
    limit: 20,
    offset,
  });

  const handleCategoryChange = useCallback((categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
    setOffset(0);
  }, []);

  const loadMore = useCallback(() => {
    if (!isFetching && posts.length >= 20) {
      setOffset((prev) => prev + 20);
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
    console.log('Like post:', post.id);
  }, [user, navigate]);

  const handleBookmark = useCallback((post: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
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

  const handleRepost = useCallback((post: any) => {
    if (!user) {
      navigate('/login');
      return;
    }
    console.log('Repost:', post.id);
  }, [user, navigate]);

  const filteredPosts = posts.filter((post: any) => {
    if (!searchQuery) return true;
    return post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
           post.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Forum</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-200 transition-all"
                />
              </div>

              {/* Create Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
              >
                <PlusIcon className="w-4 h-4" />
                Post
              </motion.button>

              {/* Profile */}
              {user && (
                <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                currentCategoryId === null
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              For You
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 ${
                  currentCategoryId === category.id
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto">
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
            <div className="divide-y divide-gray-100">
              {filteredPosts.map((post: any, index: number) => (
                <ThreadPost
                  key={post.id}
                  post={post}
                  index={index}
                  onLike={handleLike}
                  onBookmark={handleBookmark}
                  onShare={handleShare}
                  onRepost={handleRepost}
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
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
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
            <div className="text-6xl mb-4">🧵</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? 'No posts found' : 'No posts yet'}
            </h2>
            <p className="text-gray-500 mb-8">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Be the first to start a conversation!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => user ? setShowPostForm(true) : navigate('/login')}
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full font-medium hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
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

export const ForumPageThreads = () => (
  <FeatureErrorBoundary featureName="Forum">
    <ForumPageContent />
  </FeatureErrorBoundary>
);
