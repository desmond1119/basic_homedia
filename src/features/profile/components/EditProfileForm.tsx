// Edit Profile Form with avatar upload
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { updateUserProfile, uploadUserAvatar, fetchUserProfile } from '../store/profileSlice';
import { CameraIcon } from '@heroicons/react/24/outline';

export const EditProfileForm = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentProfile, updateProfile, uploadAvatar } = useAppSelector((state) => state.userProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    username: currentProfile?.username || '',
    fullName: currentProfile?.fullName || '',
    bio: currentProfile?.bio || '',
    location: currentProfile?.location || '',
    website: currentProfile?.website || '',
    companyName: currentProfile?.companyName || '',
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    const result = await dispatch(uploadUserAvatar({ userId: user.id, file }));
    if (uploadUserAvatar.fulfilled.match(result)) {
      await dispatch(updateUserProfile({ userId: user.id, data: { avatarUrl: result.payload } }));
      await dispatch(fetchUserProfile(user.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    await dispatch(updateUserProfile({ userId: user.id, data: formData }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">{t('profile.edit.title', 'Edit Profile')}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.avatar', 'Avatar')}</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentProfile?.avatarUrl ? (
                <img src={currentProfile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-white text-2xl">{formData.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition">
                <CameraIcon className="w-4 h-4 text-black" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            {uploadAvatar.status === 'pending' && <span className="text-shallow text-sm">{t('common.uploading', 'Uploading...')}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.username', 'Username')}</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.fullName', 'Full Name')}</label>
            <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="input-field w-full" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.bio', 'Bio')}</label>
          <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} maxLength={500} className="input-field w-full resize-none" placeholder={t('profile.edit.bioPlaceholder', 'Tell us about yourself...')} />
          <p className="text-xs text-shallow mt-1">{formData.bio.length}/500</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.location', 'Location')}</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field w-full" placeholder={t('profile.edit.locationPlaceholder', 'City, Country')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.website', 'Website')}</label>
            <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="input-field w-full" placeholder="https://" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">{t('profile.edit.company', 'Company')}</label>
          <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="input-field w-full" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={updateProfile.status === 'pending'} className="btn-primary">
            {updateProfile.status === 'pending' ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
          </button>
          {updateProfile.status === 'succeeded' && (
            <span className="text-green-400 text-sm flex items-center">{t('profile.edit.saved', 'Profile updated!')}</span>
          )}
        </div>
      </form>
    </motion.div>
  );
};
