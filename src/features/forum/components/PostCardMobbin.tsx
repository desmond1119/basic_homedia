// Mobbin-style post card with dark theme
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { toggleLike, toggleBookmark, toggleRepost } from '../store/forumSlice';
import { Post } from '../domain/Forum.types';
import { HeartIcon, ChatBubbleLeftIcon, ArrowPathIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface PostCardMobbinProps {
  post: Post;
  index?: number;
}

export const PostCardMobbin = ({ post, index = 0 }: PostCardMobbinProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [isReposted, setIsReposted] = useState(post.isReposted || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    await dispatch(toggleLike({
      userId: user.id,
      targetId: post.id,
      targetType: 'post',
      currentlyLiked: !newLikedState,
    }));
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsBookmarked(!isBookmarked);
    await dispatch(toggleBookmark({
      userId: user.id,
      postId: post.id,
      currentlyBookmarked: isBookmarked,
    }));
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsReposted(!isReposted);
    await dispatch(toggleRepost({
      userId: user.id,
      postId: post.id,
      currentlyReposted: isReposted,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/forum/post/${post.id}`)}
      className="mobbin-card cursor-pointer overflow-hidden border border-gray-800"
    >
      {/* User info */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.userId}`);
            }}
            className="flex-shrink-0"
          >
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.username}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-700"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ring-2 ring-gray-700">
                <span className="text-white font-semibold text-sm">
                  {post.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {post.userFullName || post.username}
            </p>
            <p className="text-xs text-shallow">
              {new Date(post.createdAt).toLocaleDateString()} • {post.categoryName}
            </p>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-3 leading-tight">{post.title}</h3>
        <p className="text-gray-300 line-clamp-3 mb-4">{post.content}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-gray-900 text-gray-400 text-xs rounded-full border border-gray-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Media */}
        {post.mediaUrls.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {post.mediaUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isLiked ? 'text-red-500 bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-500/5'
          }`}
        >
          {isLiked ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
          <span className="text-sm font-medium">{likeCount}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/forum/post/${post.id}`);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-400/5 transition-colors"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{post.commentCount}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleRepost}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            isReposted ? 'text-green-500 bg-green-500/10' : 'text-gray-400 hover:text-green-500 hover:bg-green-500/5'
          }`}
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{post.repostCount}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          className={`p-2 rounded-lg transition-colors ${
            isBookmarked ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/5'
          }`}
        >
          {isBookmarked ? <BookmarkSolid className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
        </motion.button>
      </div>
    </motion.div>
  );
};
