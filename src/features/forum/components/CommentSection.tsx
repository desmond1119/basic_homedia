import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { createComment, toggleLike } from '../store/forumSlice';
import { Comment } from '../domain/Forum.types';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  loading?: boolean;
}

export const CommentSection = ({ postId, comments, loading }: CommentSectionProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    await dispatch(createComment({
      userId: user.id,
      data: {
        postId,
        content: newComment,
      },
    }));

    setNewComment('');
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!user || !replyContent.trim()) return;

    await dispatch(createComment({
      userId: user.id,
      data: {
        postId,
        content: replyContent,
        parentId,
      },
    }));

    setReplyContent('');
    setReplyTo(null);
  };

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return;

    await dispatch(toggleLike({
      userId: user.id,
      targetId: commentId,
      targetType: 'comment',
      currentlyLiked: isLiked,
    }));
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${depth > 0 ? 'ml-12 mt-4' : 'mt-4'}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {comment.userAvatar ? (
            <img
              src={comment.userAvatar}
              alt={comment.username}
              className="h-10 w-10 rounded-full ring-2 ring-gray-800"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ring-2 ring-gray-800">
              <span className="text-white text-sm font-semibold">
                {comment.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 bg-gray-900 rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-semibold text-white">
                {comment.userFullName || comment.username}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4 mt-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleLikeComment(comment.id, comment.isLiked || false)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              {comment.isLiked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
              <span>{comment.likeCount}</span>
            </motion.button>

            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setReplyTo(comment.id);
                  setReplyContent('');
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-400 transition-colors"
              >
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span>{t('forum.comment.reply')}</span>
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {replyTo === comment.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-gray-800"
              >
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('forum.comment.replyPlaceholder')}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
                <div className="flex justify-end gap-2 mt-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setReplyTo(null)}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSubmitReply(comment.id)}
                    className="px-4 py-1.5 text-sm bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    {t('forum.comment.reply')}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {user && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmitComment}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('forum.comment.placeholder')}
            rows={3}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 resize-none focus:ring-2 focus:ring-white focus:border-transparent"
          />
          <div className="flex justify-end mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2.5 bg-white text-black rounded-full font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('forum.comment.submit')}
            </motion.button>
          </div>
        </motion.form>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-500">{t('forum.comment.noComments')}</p>
          </motion.div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  );
};
