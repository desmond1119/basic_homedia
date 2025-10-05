// User Profile Page with tabs: Overview, Edit, Followers, Bookmarks
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserProfile } from '../store/profileSlice';
import { EditProfileForm } from './EditProfileForm';
import { FollowersList } from './FollowersList';
import { BookmarksList } from './BookmarksList';
import { UserIcon, BookmarkIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

export const UserProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentProfile, fetchProfile } = useAppSelector((state) => state.userProfile);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'followers' | 'bookmarks'>('overview');

  useEffect(() => {
    if (user?.id) {
      void dispatch(fetchUserProfile(user.id));
    }
  }, [dispatch, user?.id]);

  const tabs = [
    { key: 'overview' as const, label: t('profile.tabs.overview', 'Overview'), icon: UserIcon },
    { key: 'edit' as const, label: t('profile.tabs.edit', 'Edit'), icon: Cog6ToothIcon },
    { key: 'followers' as const, label: t('profile.tabs.followers', 'Followers'), icon: UsersIcon },
    { key: 'bookmarks' as const, label: t('profile.tabs.bookmarks', 'Bookmarks'), icon: BookmarkIcon },
  ];

  if (fetchProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            {currentProfile?.avatarUrl ? (
              <img src={currentProfile.avatarUrl} alt={currentProfile.username} className="w-24 h-24 rounded-full ring-4 ring-gray-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ring-4 ring-gray-700">
                <span className="text-white text-3xl font-bold">{currentProfile?.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{currentProfile?.fullName || currentProfile?.username}</h1>
              <p className="text-shallow">@{currentProfile?.username}</p>
              {currentProfile?.bio && <p className="text-gray-300 mt-2">{currentProfile.bio}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t('profile.stats.posts', 'Posts'), value: currentProfile?.postCount || 0 },
              { label: t('profile.stats.followers', 'Followers'), value: currentProfile?.followerCount || 0 },
              { label: t('profile.stats.following', 'Following'), value: currentProfile?.followingCount || 0 },
              { label: t('profile.stats.bookmarks', 'Bookmarks'), value: currentProfile?.bookmarkCount || 0 },
            ].map((stat, i) => (
              <div key={i} className="mobbin-card p-4 text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-shallow text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.key ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-white'}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && currentProfile && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">{t('profile.about', 'About')}</h3>
                <div className="space-y-3 text-gray-300">
                  {currentProfile.location && <p>📍 {currentProfile.location}</p>}
                  {currentProfile.website && <p>🔗 <a href={currentProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{currentProfile.website}</a></p>}
                  {currentProfile.companyName && <p>🏢 {currentProfile.companyName}</p>}
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === 'edit' && <EditProfileForm />}
          {activeTab === 'followers' && <FollowersList />}
          {activeTab === 'bookmarks' && <BookmarksList />}
        </div>
      </div>
    </div>
  );
};
