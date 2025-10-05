import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { DashboardHome } from './DashboardHome';
import { CategoriesManage } from './CategoriesManage';
import { ProviderTypesManage } from './ProviderTypesManage';
import { UserApprovals } from './UserApprovals';
import { AnalyticsSettings } from './AnalyticsSettings';

type TabType = 'home' | 'categories' | 'types' | 'approvals' | 'analytics';

export const AdminDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>('home');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const tabs = [
    { key: 'home' as const, label: t('admin.tabs.home') },
    { key: 'categories' as const, label: t('admin.tabs.categories') },
    { key: 'types' as const, label: t('admin.tabs.providerTypes') },
    { key: 'approvals' as const, label: t('admin.tabs.approvals') },
    { key: 'analytics' as const, label: t('admin.tabs.analytics') },
  ];

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && <DashboardHome />}
        {activeTab === 'categories' && <CategoriesManage />}
        {activeTab === 'types' && <ProviderTypesManage />}
        {activeTab === 'approvals' && <UserApprovals />}
        {activeTab === 'analytics' && <AnalyticsSettings />}
      </div>
    </div>
  );
};
