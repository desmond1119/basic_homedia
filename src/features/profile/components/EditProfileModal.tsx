import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { closeEditModal, setEditData } from '../store/profileStatsSlice';
import { updateUserProfile } from '@/features/auth/store/authSlice';

export const EditProfileModal = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { isEditModalOpen, editData, updateProfile } = useAppSelector((state) => state.profileStats);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    dispatch(closeEditModal());
    setAvatarPreview(null);
    setErrors({});
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

    const result = await dispatch(updateUserProfile(editData));
    if (updateUserProfile.fulfilled.match(result)) {
      handleClose();
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
              className="bg-gray-900 rounded-3xl border border-gray-800 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{t('profile.edit.title')}</h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-4">
                    {t('profile.edit.avatar')}
                  </label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-800 overflow-hidden border-4 border-gray-700">
                        {avatarPreview || editData.avatarUrl ? (
                          <img
                            src={avatarPreview || editData.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
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
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors"
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
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('profile.edit.username')} *
                  </label>
                  <input
                    type="text"
                    value={editData.username || ''}
                    onChange={(e) => dispatch(setEditData({ username: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                  {errors.username && <p className="mt-2 text-sm text-red-400">{errors.username}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('profile.edit.fullName')}
                  </label>
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => dispatch(setEditData({ fullName: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('profile.edit.bio')}
                  </label>
                  <textarea
                    value={editData.bio || ''}
                    onChange={(e) => dispatch(setEditData({ bio: e.target.value }))}
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between mt-2">
                    {errors.bio && <p className="text-sm text-red-400">{errors.bio}</p>}
                    <p className="text-sm text-gray-500 ml-auto">{(editData.bio || '').length}/500</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    {t('profile.edit.location')}
                  </label>
                  <input
                    type="text"
                    value={editData.location || ''}
                    onChange={(e) => dispatch(setEditData({ location: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    disabled={updateProfile.status === 'pending'}
                    className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {updateProfile.status === 'pending' ? t('profile.edit.saving') : t('profile.edit.save')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleClose}
                    className="px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
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
