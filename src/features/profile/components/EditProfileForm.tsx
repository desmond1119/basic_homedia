// Edit Profile Form with avatar upload
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { updateUserProfile, uploadUserAvatar, fetchUserProfile } from '../store/profileSlice';
import { setAuthUser } from '@/features/auth/store/authSlice';
import { CameraIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Input } from '@/shared/components/Input';
import { Textarea } from '@/shared/components/Textarea';
import toast from 'react-hot-toast';

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

    try {
      console.log('Starting avatar upload...', { userId: user.id, fileName: file.name, fileSize: file.size });
      
      const result = await dispatch(uploadUserAvatar({ userId: user.id, file }));
      
      if (uploadUserAvatar.fulfilled.match(result)) {
        const avatarUrl = result.payload;
        console.log('Avatar uploaded, URL:', avatarUrl);
        
        // Update profile with new avatar URL
        const updateResult = await dispatch(updateUserProfile({ 
          userId: user.id, 
          data: { avatarUrl } 
        }));
        
        console.log('Profile update result:', updateResult);
        
        if (updateUserProfile.fulfilled.match(updateResult)) {
          // Refresh profile to ensure UI updates
          await dispatch(fetchUserProfile(user.id));
          
          // Update auth state to refresh navigation bar avatar
          dispatch(setAuthUser({
            ...user,
            avatarUrl
          }));
          
          toast.success(t('profile.edit.avatarUploadSuccess'), {
            icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
            duration: 3000,
          });
        } else {
          throw new Error('Failed to update profile with avatar URL');
        }
      } else if (uploadUserAvatar.rejected.match(result)) {
        const errorMessage = result.payload as string || t('profile.edit.avatarUploadError');
        
        console.error('Avatar upload rejected:', errorMessage);
        
        let translatedError = t('profile.edit.avatarUploadError');
        if (errorMessage.includes('AVATAR_TOO_LARGE')) {
          translatedError = t('profile.edit.errors.avatarTooLarge');
        } else if (errorMessage.includes('INVALID_FILE_TYPE')) {
          translatedError = t('profile.edit.errors.invalidFileType');
        }
        
        toast.error(translatedError, {
          icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(t('profile.edit.avatarUploadError'), {
        icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
        duration: 4000,
      });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    await dispatch(updateUserProfile({ userId: user.id, data: formData }));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('profile.edit.title', 'Edit Profile')}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.edit.avatar', 'Avatar')}</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {currentProfile?.avatarUrl ? (
                <img 
                  key={currentProfile.avatarUrl}
                  src={currentProfile.avatarUrl} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-gray-200"
                  onError={(e) => {
                    console.error('Failed to load avatar:', currentProfile.avatarUrl);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-gray-200">
                  <span className="text-white text-2xl">{formData.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadAvatar.status === 'pending'}
                className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CameraIcon className="w-4 h-4 text-gray-900" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleAvatarChange} className="hidden" />
            {uploadAvatar.status === 'pending' && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600 text-sm">{t('common.uploading')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('profile.edit.username', 'Username')}
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          <Input
            label={t('profile.edit.fullName', 'Full Name')}
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
        </div>

        <div>
          <Textarea
            label={t('profile.edit.bio', 'Bio')}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            maxLength={500}
            placeholder={t('profile.edit.bioPlaceholder', 'Tell us about yourself...')}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t('profile.edit.location', 'Location')}
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder={t('profile.edit.locationPlaceholder', 'City, Country')}
          />
          <Input
            label={t('profile.edit.website', 'Website')}
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://"
          />
        </div>

        <Input
          label={t('profile.edit.company', 'Company')}
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
        />

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
