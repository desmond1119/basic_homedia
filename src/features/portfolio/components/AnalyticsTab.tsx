import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { HeartIcon, EyeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchPortfolioAnalytics } from '../store/portfolioSlice';

interface Props {
  portfolioId: string;
}

export const AnalyticsTab = ({ portfolioId }: Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { analytics, fetchAnalytics } = useAppSelector((state) => state.portfolio);

  useEffect(() => {
    void dispatch(fetchPortfolioAnalytics({ portfolioId, days: 30 }));
  }, [dispatch, portfolioId]);

  if (fetchAnalytics.status === 'pending') {
    return (
      <div className="flex justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!analytics) return null;

  const maxImpressions = Math.max(...analytics.dailyImpressions.map(d => d.count), 1);
  const maxCollects = Math.max(...analytics.dailyCollects.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <EyeIcon className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-gray-400">{t('portfolio.analytics.impressions')}</span>
          </div>
          <p className="text-4xl font-bold text-white">{analytics.impressionsCount.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <HeartIcon className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-gray-400">{t('portfolio.analytics.collects')}</span>
          </div>
          <p className="text-4xl font-bold text-white">{analytics.collectsCount.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <ChartBarIcon className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-gray-400">{t('portfolio.analytics.engagement')}</span>
          </div>
          <p className="text-4xl font-bold text-white">
            {analytics.impressionsCount > 0 
              ? ((analytics.collectsCount / analytics.impressionsCount) * 100).toFixed(1)
              : '0.0'}%
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
      >
        <h3 className="text-xl font-bold text-white mb-6">{t('portfolio.analytics.impressionsChart')}</h3>
        <div className="h-64 flex items-end gap-1">
          {analytics.dailyImpressions.slice(-30).map((day, index) => (
            <div
              key={day.date}
              className="flex-1 group relative"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.count / maxImpressions) * 100}%` }}
                transition={{ delay: index * 0.02 }}
                className="w-full bg-blue-500 rounded-t hover:bg-blue-400 transition-colors"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {day.date}: {day.count}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900 rounded-2xl p-6 border border-gray-800"
      >
        <h3 className="text-xl font-bold text-white mb-6">{t('portfolio.analytics.collectsChart')}</h3>
        <div className="h-64 flex items-end gap-1">
          {analytics.dailyCollects.slice(-30).map((day, index) => (
            <div
              key={day.date}
              className="flex-1 group relative"
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(day.count / maxCollects) * 100}%` }}
                transition={{ delay: index * 0.02 }}
                className="w-full bg-red-500 rounded-t hover:bg-red-400 transition-colors"
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {day.date}: {day.count}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
