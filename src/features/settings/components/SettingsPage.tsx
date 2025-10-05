import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth/context/AuthContext';
import { 
  UserCircleIcon, 
  BellIcon, 
  ShieldCheckIcon, 
  GlobeAltIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

export const SettingsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: t('settings.tabs.profile'), icon: UserCircleIcon },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: BellIcon },
    { id: 'privacy', label: t('settings.tabs.privacy'), icon: ShieldCheckIcon },
    { id: 'language', label: t('settings.tabs.language'), icon: GlobeAltIcon },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: PaintBrushIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">{t('settings.title')}</h1>
          <p className="mt-2 text-gray-600">{t('settings.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'profile' && <ProfileSettings user={user} />}
              {activeTab === 'notifications' && <NotificationSettings />}
              {activeTab === 'privacy' && <PrivacySettings />}
              {activeTab === 'language' && <LanguageSettings />}
              {activeTab === 'appearance' && <AppearanceSettings />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ProfileSettings = ({ user }: { user: any }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.profile.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('settings.profile.subtitle')}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <button className="btn-secondary text-sm">{t('settings.profile.changeAvatar')}</button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.username')}
          </label>
          <input
            type="text"
            defaultValue={user?.username}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.email')}
          </label>
          <input
            type="email"
            defaultValue={user?.email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-xs text-gray-500">{t('settings.profile.emailNote')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.fullName')}
          </label>
          <input
            type="text"
            defaultValue={user?.full_name || ''}
            placeholder={t('settings.profile.fullNamePlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.profile.bio')}
          </label>
          <textarea
            rows={4}
            defaultValue={user?.bio || ''}
            placeholder={t('settings.profile.bioPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button className="btn-secondary">{t('common.cancel')}</button>
        <button className="btn-primary">{t('common.save')}</button>
      </div>
    </div>
  );
};

const NotificationSettings = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    newFollowers: true,
    newLikes: true,
    newComments: true,
    newsletter: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.notifications.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('settings.notifications.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {Object.entries(settings).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{t(`settings.notifications.${key}`)}</p>
              <p className="text-xs text-gray-500 mt-1">{t(`settings.notifications.${key}Desc`)}</p>
            </div>
            <button
              onClick={() => toggleSetting(key as keyof typeof settings)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const PrivacySettings = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.privacy.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('settings.privacy.subtitle')}</p>
      </div>

      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('common.comingSoon')}</p>
        </div>
      </div>
    </div>
  );
};

const LanguageSettings = () => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState('zh-TW');

  const languages = [
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.language.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('settings.language.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setSelectedLanguage(lang.code)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
              selectedLanguage === lang.code
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-gray-900">{lang.name}</span>
            </div>
            {selectedLanguage === lang.code && (
              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

const AppearanceSettings = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState('light');

  const themes = [
    { id: 'light', name: t('settings.appearance.light'), icon: '☀️' },
    { id: 'dark', name: t('settings.appearance.dark'), icon: '🌙' },
    { id: 'auto', name: t('settings.appearance.auto'), icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('settings.appearance.title')}</h2>
        <p className="text-sm text-gray-600 mb-6">{t('settings.appearance.subtitle')}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {themes.map((themeOption) => (
          <button
            key={themeOption.id}
            onClick={() => setTheme(themeOption.id)}
            className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
              theme === themeOption.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span className="text-4xl">{themeOption.icon}</span>
            <span className="text-sm font-medium text-gray-900">{themeOption.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
