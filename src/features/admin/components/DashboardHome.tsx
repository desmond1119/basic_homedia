import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchAdminStats } from '../store/adminSlice';
import { UserGroupIcon, UserIcon, DocumentTextIcon, StarIcon, ClockIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export const DashboardHome = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { stats, fetchStats } = useAppSelector((state) => state.admin);

  useEffect(() => {
    void dispatch(fetchAdminStats());
  }, [dispatch]);

  if (fetchStats.status === 'pending') {
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

  const statCards = [
    { label: t('admin.stats.totalUsers'), value: stats?.totalUsers || 0, icon: UserGroupIcon, color: 'bg-blue-500' },
    { label: t('admin.stats.totalProviders'), value: stats?.totalProviders || 0, icon: UserIcon, color: 'bg-purple-500' },
    { label: t('admin.stats.totalPosts'), value: stats?.totalPosts || 0, icon: DocumentTextIcon, color: 'bg-green-500' },
    { label: t('admin.stats.totalReviews'), value: stats?.totalReviews || 0, icon: StarIcon, color: 'bg-yellow-500' },
    { label: t('admin.stats.pendingPortfolios'), value: stats?.pendingPortfolios || 0, icon: ClockIcon, color: 'bg-orange-500' },
    { label: t('admin.stats.newUsersWeek'), value: stats?.newUsersWeek || 0, icon: ArrowTrendingUpIcon, color: 'bg-pink-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`${card.color} p-3 rounded-xl text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.growth.title')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('admin.growth.thisWeek')}</span>
              <span className="text-xl font-bold text-green-600">+{stats?.newUsersWeek || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('admin.growth.thisMonth')}</span>
              <span className="text-xl font-bold text-blue-600">+{stats?.newUsersMonth || 0}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">{t('admin.quickActions.title')}</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-3 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors">
              {t('admin.quickActions.reviewPending')}
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors">
              {t('admin.quickActions.manageCategories')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
