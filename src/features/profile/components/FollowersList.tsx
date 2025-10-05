// Followers and Following Lists
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserFollowers, fetchUserFollowing } from '../store/profileSlice';

export const FollowersList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { followers, following, fetchFollowers, fetchFollowing } = useAppSelector((state) => state.userProfile);
  const [activeView, setActiveView] = useState<'followers' | 'following'>('followers');

  useEffect(() => {
    if (user?.id) {
      void dispatch(fetchUserFollowers(user.id));
      void dispatch(fetchUserFollowing(user.id));
    }
  }, [dispatch, user?.id]);

  const currentList = activeView === 'followers' ? followers : following;
  const isLoading = activeView === 'followers' ? fetchFollowers.status === 'pending' : fetchFollowing.status === 'pending';

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveView('followers')} className={`px-4 py-2 rounded-lg transition ${activeView === 'followers' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          {t('profile.followers', 'Followers')} ({followers.length})
        </button>
        <button onClick={() => setActiveView('following')} className={`px-4 py-2 rounded-lg transition ${activeView === 'following' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
          {t('profile.following', 'Following')} ({following.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-12 text-shallow">
          {activeView === 'followers' ? t('profile.noFollowers', 'No followers yet') : t('profile.noFollowing', 'Not following anyone yet')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((user, index) => (
            <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="mobbin-card p-4 cursor-pointer" onClick={() => navigate(`/profile/${user.id}`)}>
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                    <span className="text-white font-semibold">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{user.fullName || user.username}</p>
                  <p className="text-shallow text-sm truncate">@{user.username}</p>
                  {user.bio && <p className="text-gray-400 text-sm line-clamp-1 mt-1">{user.bio}</p>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
