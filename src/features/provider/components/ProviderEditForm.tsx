import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ProviderProfile, UpdateProviderProfileData, SocialLinks } from '../domain/Provider.types';

interface Props {
  profile: ProviderProfile;
  isAdmin: boolean;
  onSave: (data: UpdateProviderProfileData, logoFile: File | null) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ProviderEditForm = ({ profile, isAdmin, onSave, onCancel, isSaving }: Props) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    companyName: profile.companyName,
    bio: profile.bio || '',
    priceMin: profile.priceRange.min,
    priceMax: profile.priceRange.max,
    currency: profile.priceRange.currency,
    teamSize: profile.teamSize,
    foundedYear: profile.foundedYear || new Date().getFullYear(),
    experienceYears: profile.experienceYears,
    completedProjects: profile.completedProjects,
    isApproved: profile.isApproved,
    socialLinks: { ...profile.socialLinks },
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoUrl);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLinkChange = (key: keyof SocialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value || undefined },
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = t('provider.edit.errors.companyNameRequired');
    }
    
    if (formData.priceMin < 0) {
      newErrors.priceMin = t('provider.edit.errors.priceMinInvalid');
    }
    
    if (formData.priceMax < formData.priceMin) {
      newErrors.priceMax = t('provider.edit.errors.priceMaxLessThanMin');
    }
    
    if (formData.teamSize < 0) {
      newErrors.teamSize = t('provider.edit.errors.teamSizeInvalid');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const updateData: UpdateProviderProfileData = {
      companyName: formData.companyName,
      bio: formData.bio,
      priceRange: {
        min: formData.priceMin,
        max: formData.priceMax,
        currency: formData.currency,
      },
      socialLinks: formData.socialLinks,
      teamSize: formData.teamSize,
      foundedYear: formData.foundedYear,
      experienceYears: formData.experienceYears,
      completedProjects: formData.completedProjects,
    };

    if (isAdmin) {
      updateData.isApproved = formData.isApproved;
    }

    onSave(updateData, logoFile);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">{t('provider.edit.basicInfo')}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.logo')}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-gray-800 border-2 border-gray-700 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <PhotoIcon className="w-8 h-8 text-gray-600" />
                )}
              </div>
              <label className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg cursor-pointer transition-colors">
                {t('provider.edit.uploadLogo')}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.companyName')} *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
            {errors.companyName && <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.bio')}
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">{t('provider.edit.pricing')}</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.priceMin')}
            </label>
            <input
              type="number"
              value={formData.priceMin}
              onChange={(e) => setFormData(prev => ({ ...prev, priceMin: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
            {errors.priceMin && <p className="text-red-400 text-sm mt-1">{errors.priceMin}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.priceMax')}
            </label>
            <input
              type="number"
              value={formData.priceMax}
              onChange={(e) => setFormData(prev => ({ ...prev, priceMax: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
            {errors.priceMax && <p className="text-red-400 text-sm mt-1">{errors.priceMax}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.edit.currency')}
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="HKD">HKD</option>
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">{t('provider.edit.stats')}</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.stats.team')}
            </label>
            <input
              type="number"
              value={formData.teamSize}
              onChange={(e) => setFormData(prev => ({ ...prev, teamSize: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
            {errors.teamSize && <p className="text-red-400 text-sm mt-1">{errors.teamSize}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.stats.founded')}
            </label>
            <input
              type="number"
              value={formData.foundedYear}
              onChange={(e) => setFormData(prev => ({ ...prev, foundedYear: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.stats.experience')}
            </label>
            <input
              type="number"
              value={formData.experienceYears}
              onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t('provider.stats.projects')}
            </label>
            <input
              type="number"
              value={formData.completedProjects}
              onChange={(e) => setFormData(prev => ({ ...prev, completedProjects: Number(e.target.value) }))}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <h3 className="text-xl font-bold text-white mb-6">{t('provider.edit.socialLinks')}</h3>

        <div className="grid grid-cols-2 gap-4">
          {(['phone', 'email', 'website', 'facebook', 'instagram', 'youtube'] as const).map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {t(`provider.edit.social.${key}`)}
              </label>
              <input
                type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'url'}
                value={formData.socialLinks[key] || ''}
                onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="text-xl font-bold text-white mb-6">{t('provider.edit.adminControls')}</h3>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isApproved}
              onChange={(e) => setFormData(prev => ({ ...prev, isApproved: e.target.checked }))}
              className="w-5 h-5 rounded border-gray-700 bg-gray-800 text-white focus:ring-2 focus:ring-white"
            />
            <span className="text-white">{t('provider.edit.approvedStatus')}</span>
          </label>
        </div>
      )}

      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              {t('provider.edit.saving')}
            </>
          ) : (
            <>
              <CheckIcon className="w-5 h-5" />
              {t('provider.edit.save')}
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
          {t('provider.edit.cancel')}
        </motion.button>
      </div>
    </motion.div>
  );
};
