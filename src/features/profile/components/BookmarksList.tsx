// Bookmarked Posts List
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserBookmarks } from '../store/profileSlice';
import { HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export const BookmarksList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { bookmarks, fetchBookmarks } = useAppSelector((state) => state.userProfile);

  useEffect(() => {
    if (user?.id) {
      void dispatch(fetchUserBookmarks(user.id));
    }
  }, [dispatch, user?.id]);

  if (fetchBookmarks.status === 'pending') {
    return (
      <div className="flex justify-center py-12">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔖</div>
        <p className="text-shallow text-lg">{t('profile.noBookmarks', 'No bookmarks yet')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark, index) => (
        <motion.div key={bookmark.bookmarkId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="mobbin-card p-6 cursor-pointer" onClick={() => navigate(`/forum/post/${bookmark.postId}`)}>
          <div className="flex items-start gap-3 mb-4">
            {bookmark.authorAvatar ? (
              <img src={bookmark.authorAvatar} alt={bookmark.authorUsername} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{bookmark.authorUsername.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{bookmark.authorUsername}</p>
              <p className="text-xs text-shallow">{new Date(bookmark.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{bookmark.title}</h3>
          <p className="text-gray-300 line-clamp-2 mb-4">{bookmark.content}</p>

          <div className="flex items-center gap-4 text-shallow text-sm">
            <div className="flex items-center gap-1">
              <HeartIcon className="w-4 h-4" />
              <span>{bookmark.likeCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span>{bookmark.commentCount}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
