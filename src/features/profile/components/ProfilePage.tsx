import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PencilIcon, UserGroupIcon, PhotoIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserStats, openEditModal, updateStatsRealtime } from '../store/profileStatsSlice';
import { ProfileStatsRepositoryFixed as ProfileStatsRepository } from '../infrastructure/ProfileStatsRepositoryFixed';
import { EditProfileModal } from './EditProfileModal';

const repository = new ProfileStatsRepository();

export const ProfilePage = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const { stats, fetchStats } = useAppSelector((state) => state.profileStats);
  const currentUser = useAppSelector((state) => state.auth.user);
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      void dispatch(fetchUserStats(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = repository.subscribeToStats(userId, (updatedStats) => {
      dispatch(updateStatsRealtime(updatedStats));
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch, userId]);

  if (fetchStats.status === 'pending') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-xl font-semibold">{t('profile.notFound')}</p>
          <p className="text-gray-500 mt-2">{t('profile.notFoundDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-8 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-red-50 to-red-100 overflow-hidden border-4 border-white shadow-lg"
            >
              {stats.avatarUrl ? (
                <img src={stats.avatarUrl} alt={stats.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-red-500">
                  {stats.username?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{stats.username}</h1>
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => dispatch(openEditModal())}
                    className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
                  >
                    <PencilIcon className="w-4 h-4" />
                    {t('profile.edit.button')}
                  </motion.button>
                )}
              </div>

              {stats.fullName && (
                <p className="text-gray-600 text-lg mb-3">{stats.fullName}</p>
              )}

              {stats.bio && (
                <p className="text-gray-700 mb-4 leading-relaxed">{stats.bio}</p>
              )}

              {stats.badges.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  {stats.badges.map((badge) => (
                    <motion.div
                      key={badge.id}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full text-sm font-medium text-yellow-700 flex items-center gap-2 shadow-sm"
                    >
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </motion.div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3">
                <StatsButton
                  icon={<UserGroupIcon className="w-5 h-5" />}
                  count={stats.followersCount}
                  label={t('profile.stats.followers')}
                  onClick={() => navigate(`/profile/${userId}/followers`)}
                />
                <StatsButton
                  icon={<UserGroupIcon className="w-5 h-5" />}
                  count={stats.followingCount}
                  label={t('profile.stats.following')}
                  onClick={() => navigate(`/profile/${userId}/following`)}
                />
                <StatsButton
                  icon={<PhotoIcon className="w-5 h-5" />}
                  count={stats.collectedImagesCount}
                  label={t('profile.stats.collected')}
                  onClick={() => navigate(`/profile/${userId}/collections`)}
                />
                <StatsButton
                  icon={<ChatBubbleLeftIcon className="w-5 h-5" />}
                  count={stats.forumResponsesCount}
                  label={t('profile.stats.responses')}
                  onClick={() => navigate(`/forum?userId=${userId}`)}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <EditProfileModal />
    </div>
  );
};

interface StatsButtonProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  onClick: () => void;
}

const StatsButton = ({ icon, count, label, onClick }: StatsButtonProps) => (
  <motion.button
    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border-2 border-gray-100 hover:border-red-200 transition-all"
  >
    <div className="text-gray-600">{icon}</div>
    <div className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</div>
    <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</div>
  </motion.button>
);
