import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { PencilIcon, UserGroupIcon, HeartIcon, PhotoIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserStats, openEditModal, updateStatsRealtime } from '../store/profileStatsSlice';
import { ProfileStatsRepository } from '../infrastructure/ProfileStatsRepository';
import { EditProfileModal } from './EditProfileModal';

const repository = new ProfileStatsRepository();

export const ProfileStatsPage = () => {
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-xl">{t('profile.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-3xl border border-gray-800 p-8"
        >
          <div className="flex items-start gap-8 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 overflow-hidden border-4 border-gray-800"
            >
              {stats.avatarUrl ? (
                <img src={stats.avatarUrl} alt={stats.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                  {stats.username[0].toUpperCase()}
                </div>
              )}
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-white">{stats.username}</h1>
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => dispatch(openEditModal())}
                    className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    {t('profile.edit.button')}
                  </motion.button>
                )}
              </div>

              {stats.fullName && (
                <p className="text-gray-400 text-lg mb-3">{stats.fullName}</p>
              )}

              {stats.bio && (
                <p className="text-gray-300 mb-6 leading-relaxed">{stats.bio}</p>
              )}

              <div className="flex items-center gap-2 mb-6">
                {stats.badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-sm font-medium text-yellow-300 flex items-center gap-2"
                  >
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-4">
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
                  onClick={() => navigate(`/profile/${userId}/responses`)}
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
    whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.2)' }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 bg-gray-800 rounded-2xl border border-gray-700 hover:border-gray-600 transition-all"
  >
    <div className="text-white">{icon}</div>
    <div className="text-2xl font-bold text-white">{count.toLocaleString()}</div>
    <div className="text-xs text-gray-400 uppercase tracking-wider">{label}</div>
  </motion.button>
);
