import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchGlobalSettings, updateGlobalSettings } from '../store/adminSlice';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export const AnalyticsSettings = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { globalSettings, fetchSettings, updateSettings } = useAppSelector((state) => state.admin);
  const [formData, setFormData] = useState({
    siteName: '',
    darkMode: false,
    featuredCategories: [] as string[],
  });

  useEffect(() => {
    void dispatch(fetchGlobalSettings());
  }, [dispatch]);

  useEffect(() => {
    if (globalSettings) {
      setFormData({
        siteName: globalSettings.siteName,
        darkMode: globalSettings.darkMode,
        featuredCategories: globalSettings.featuredCategories,
      });
    }
  }, [globalSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updateGlobalSettings(formData));
    void dispatch(fetchGlobalSettings());
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,';
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `admin_data_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (fetchSettings.status === 'pending') {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('admin.settings.title')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.settings.siteName')}</label>
            <input
              type="text"
              value={formData.siteName}
              onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="darkMode"
              checked={formData.darkMode}
              onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
              className="w-4 h-4 text-red-500 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="darkMode" className="text-sm font-medium text-gray-700">
              {t('admin.settings.darkMode')}
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={updateSettings.status === 'pending'}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {updateSettings.status === 'pending' ? t('admin.saving') : t('admin.save')}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.export.title')}</h3>
        <p className="text-sm text-gray-600 mb-4">{t('admin.export.description')}</p>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          {t('admin.export.exportCSV')}
        </button>
      </div>
    </div>
  );
};
