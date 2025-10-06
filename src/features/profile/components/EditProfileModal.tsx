import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PhotoIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { closeEditModal, setEditData, fetchUserStats } from '../store/profileStatsSlice';
import { updateUserProfile } from '../store/profileSlice';
import toast from 'react-hot-toast';

export const EditProfileModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isEditModalOpen, editData } = useAppSelector((state) => state.profileStats);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    dispatch(closeEditModal());
    setAvatarPreview(null);
    setErrors({});
    setIsSaving(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, avatar: t('profile.edit.errors.avatarTooLarge') });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editData.username || editData.username.trim().length < 3) {
      newErrors.username = t('profile.edit.errors.usernameTooShort');
    }

    if (editData.username && !/^[a-zA-Z0-9_]+$/.test(editData.username)) {
      newErrors.username = t('profile.edit.errors.usernameInvalid');
    }

    if (editData.bio && editData.bio.length > 500) {
      newErrors.bio = t('profile.edit.errors.bioTooLong');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user?.id) return;
    
    setIsSaving(true);
    
    try {
      const avatarFile = avatarPreview && fileInputRef.current?.files?.[0] ? fileInputRef.current.files[0] : undefined;

      await dispatch(updateUserProfile({
        userId: user.id,
        data: editData,
        avatarFile,
      })).unwrap();

      await dispatch(fetchUserStats(user.id)).unwrap();

      toast.success(t('profile.edit.saved'), {
        icon: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
        duration: 3000,
      });

      handleClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      const errorMsg = error instanceof Error ? error.message : t('profile.edit.error');
      
      let displayMessage = t('profile.edit.error');
      
      if (errorMsg === 'USERNAME_TAKEN') {
        displayMessage = t('profile.edit.errors.usernameTaken');
      } else if (errorMsg.startsWith('USERNAME_COOLDOWN:')) {
        const days = errorMsg.split(':')[1];
        displayMessage = t('profile.edit.errors.usernameCooldown', { days });
      } else if (errorMsg === 'AVATAR_TOO_LARGE') {
        displayMessage = t('profile.edit.errors.avatarTooLarge');
      } else if (errorMsg === 'INVALID_FILE_TYPE') {
        displayMessage = t('profile.edit.errors.invalidFileType');
      } else if (errorMsg.startsWith('AVATAR_UPLOAD_FAILED:')) {
        displayMessage = t('profile.edit.avatarUploadError');
      }
      
      toast.error(displayMessage, {
        icon: <XCircleIcon className="w-5 h-5 text-red-500" />,
        duration: 4000,
      });
      
      setErrors({ ...errors, save: displayMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isEditModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{t('profile.edit.title')}</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    {t('profile.edit.avatar')}
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-gray-200">
                        {avatarPreview || editData.avatarUrl ? (
                          <img
                            src={avatarPreview || editData.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Avatar preview failed to load:', avatarPreview || editData.avatarUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => {
                              console.log('Avatar loaded successfully:', avatarPreview || editData.avatarUrl);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-10 h-10 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-gray-100 text-gray-900 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      {t('profile.edit.changeAvatar')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  {errors.avatar && <p className="mt-2 text-sm text-red-400">{errors.avatar}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.edit.username')} *
                  </label>
                  <input
                    type="text"
                    value={editData.username || ''}
                    onChange={(e) => dispatch(setEditData({ username: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                  />
                  {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.edit.fullName')}
                  </label>
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => dispatch(setEditData({ fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.edit.bio')}
                  </label>
                  <textarea
                    value={editData.bio || ''}
                    onChange={(e) => dispatch(setEditData({ bio: e.target.value }))}
                    rows={4}
                    maxLength={500}
                    placeholder={t('profile.edit.bioPlaceholder')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200 resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    {errors.bio && <p className="text-sm text-red-400">{errors.bio}</p>}
                    <p className="text-sm text-gray-500 ml-auto">{(editData.bio || '').length}/500</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('profile.edit.location')}
                  </label>
                  <input
                    type="text"
                    value={editData.location || ''}
                    onChange={(e) => dispatch(setEditData({ location: e.target.value }))}
                    placeholder={t('profile.edit.locationPlaceholder')}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                  />
                </div>

                {errors.save && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {errors.save}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: isSaving ? 1 : 1.02 }}
                    whileTap={{ scale: isSaving ? 1 : 0.98 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? t('profile.edit.saving') : t('profile.edit.save')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    {t('profile.edit.cancel')}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
