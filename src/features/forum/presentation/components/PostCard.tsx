import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Share2,
  Bookmark,
  ChevronUp,
  ChevronDown,
  Flag,
  MoreHorizontal,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { type AppDispatch } from '@/core/store/store';
import { upvoteThunk, downvoteThunk, reportPostThunk } from '../../infrastructure/ForumThunks';
import { ForumPost } from '../../infrastructure/ForumThunks';

interface PostCardProps {
  post: ForumPost;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(null);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === 'upvote') {
      setUserVote(null);
    } else {
      setUserVote('upvote');
      await dispatch(upvoteThunk({ targetId: post.id, targetType: 'post' }));
    }
  };

  const handleDownvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userVote === 'downvote') {
      setUserVote(null);
    } else {
      setUserVote('downvote');
      await dispatch(downvoteThunk({ targetId: post.id, targetType: 'post' }));
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const reason = prompt(t('forum.reportReason'));
    if (reason) {
      await dispatch(reportPostThunk({ targetId: post.id, targetType: 'post', reason }));
    }
  };

  const gradients = [
    'from-pink-400 to-purple-400',
    'from-blue-400 to-cyan-400',
    'from-purple-400 to-pink-400',
    'from-green-400 to-teal-400',
    'from-yellow-400 to-orange-400',
    'from-red-400 to-pink-400',
  ];

  const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group"
    >
      {/* Media or Gradient Background */}
      {post.media_urls && post.media_urls.length > 0 ? (
        <div className="relative aspect-[4/5] overflow-hidden">
          <img
            src={post.media_urls[0]}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
        </div>
      ) : (
        <div className={`relative aspect-[4/5] bg-gradient-to-br ${randomGradient} p-6 flex items-center justify-center`}>
          <h3 className="text-white font-bold text-xl text-center line-clamp-3">
            {post.title}
          </h3>
        </div>
      )}

      {/* Hover Actions */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-3 right-3 flex gap-2"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle bookmark
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <Bookmark className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-700" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions Dropdown */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 right-3 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20"
          >
            <button
              onClick={handleReport}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 w-full"
            >
              <Flag className="w-4 h-4" />
              {t('forum.report')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="p-4">
        {/* Title (if media exists) */}
        {post.media_urls && post.media_urls.length > 0 && (
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
            {post.title}
          </h3>
        )}

        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
          {post.content}
        </p>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* User Info */}
        <div className="flex items-center gap-2 mb-3">
          {post.avatar_url ? (
            <img
              src={post.avatar_url}
              alt={post.username}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-gradient-to-br from-pink-400 to-purple-400 rounded-full" />
          )}
          <span className="text-sm text-gray-700 font-medium">
            {post.display_name || post.username}
          </span>
        </div>

        {/* Interaction Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Upvote/Downvote */}
            <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2 py-1">
              <button
                onClick={handleUpvote}
                className={`p-1 rounded-full transition-colors ${
                  userVote === 'upvote' ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
                }`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[20px] text-center">
                {(post.score || 0)}
              </span>
              <button
                onClick={handleDownvote}
                className={`p-1 rounded-full transition-colors ${
                  userVote === 'downvote' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Comments */}
            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">{post.comment_count || 0}</span>
            </button>

            {/* Share */}
            <button className="text-gray-500 hover:text-purple-500 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostCard;
