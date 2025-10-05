import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchPostById, fetchComments, clearSelectedPost } from '../store/forumSlice';
import { CommentSection } from './CommentSection';
import { PostCard } from './PostCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const PostDetailPage = () => {
  const { t } = useTranslation();
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedPost, comments, fetchPost, fetchComments: fetchCommentsState } = useAppSelector((state) => state.forum);

  useEffect(() => {
    if (postId) {
      void dispatch(fetchPostById(postId));
      void dispatch(fetchComments(postId));
    }

    return () => {
      dispatch(clearSelectedPost());
    };
  }, [dispatch, postId]);

  if (fetchPost.status === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!selectedPost) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('forum.post.notFound')}</h2>
          <button
            onClick={() => navigate('/forum')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {t('common.back')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-['Inter']">
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-black/80 border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ x: -4 }}
            onClick={() => navigate('/forum')}
            className="flex items-center gap-2 py-6 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span className="font-medium">{t('common.back')}</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <PostCard post={selectedPost} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6">
            {t('forum.comment.title')} ({selectedPost.commentCount})
          </h3>
          <CommentSection
            postId={selectedPost.id}
            comments={comments}
            loading={fetchCommentsState.status === 'pending'}
          />
        </motion.div>
      </div>
    </div>
  );
};
