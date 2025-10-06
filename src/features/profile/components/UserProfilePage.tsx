import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUserProfile } from '../store/profileSlice';
import { EditProfileForm } from './EditProfileForm';
import { FollowersList } from './FollowersList';
import { BookmarksList } from './BookmarksList';
import { 
  UserIcon, 
  BookmarkIcon, 
  UsersIcon, 
  Cog6ToothIcon,
  MapPinIcon,
  LinkIcon,
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';

export const UserProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentProfile, fetchProfile } = useAppSelector((state) => state.userProfile);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'followers' | 'bookmarks'>('overview');

  useEffect(() => {
    const userId = id || user?.id;
    if (userId) {
      void dispatch(fetchUserProfile(userId));
    }
  }, [dispatch, id, user?.id]);

  const tabs = [
    { key: 'overview' as const, label: t('profile.tabs.overview') || 'Overview', icon: UserIcon },
    { key: 'edit' as const, label: t('profile.tabs.edit') || 'Edit', icon: Cog6ToothIcon },
    { key: 'followers' as const, label: t('profile.tabs.followers') || 'Followers', icon: UsersIcon },
    { key: 'bookmarks' as const, label: t('profile.tabs.bookmarks') || 'Bookmarks', icon: BookmarkIcon },
  ];

  if (fetchProfile.status === 'pending') {
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

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profile.notFound') || 'Profile not found'}</h2>
          <p className="text-gray-600">{t('profile.notFoundDesc') || 'This user profile does not exist'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              {currentProfile.avatarUrl ? (
                <img 
                  key={currentProfile.avatarUrl}
                  src={currentProfile.avatarUrl} 
                  alt={currentProfile.username} 
                  className="w-32 h-32 rounded-full ring-4 ring-gray-100 object-cover" 
                  onError={(e) => {
                    console.error('Avatar failed to load:', currentProfile.avatarUrl);
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center ring-4 ring-gray-100"
                style={{ display: currentProfile.avatarUrl ? 'none' : 'flex' }}
              >
                <span className="text-white text-4xl font-bold">
                  {currentProfile.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {currentProfile.fullName || currentProfile.username}
              </h1>
              <p className="text-gray-600 mb-3">@{currentProfile.username}</p>
              {currentProfile.bio && (
                <p className="text-gray-700 mb-4">{currentProfile.bio}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {currentProfile.location && (
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{currentProfile.location}</span>
                  </div>
                )}
                {currentProfile.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <a 
                      href={currentProfile.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-red-500 hover:underline"
                    >
                      {currentProfile.website}
                    </a>
                  </div>
                )}
                {currentProfile.companyName && (
                  <div className="flex items-center gap-1">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{currentProfile.companyName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: t('profile.stats.posts') || 'Posts', value: currentProfile.postCount || 0 },
              { label: t('profile.stats.followers') || 'Followers', value: currentProfile.followerCount || 0 },
              { label: t('profile.stats.following') || 'Following', value: currentProfile.followingCount || 0 },
              { label: t('profile.stats.bookmarks') || 'Bookmarks', value: currentProfile.bookmarkCount || 0 },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-gray-600 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key)} 
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.key 
                    ? 'border-red-500 text-red-500' 
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {t('profile.about') || 'About'}
                </h3>
                <div className="text-gray-700">
                  {!currentProfile.location && !currentProfile.website && !currentProfile.companyName && (
                    <p className="text-gray-500">{t('profile.noInfo') || 'No additional information available'}</p>
                  )}
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
