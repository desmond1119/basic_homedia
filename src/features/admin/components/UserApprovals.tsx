import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { fetchUsers, approveUser, updateUserRole, fetchPendingPortfolios, approvePortfolio, rejectPortfolio } from '../store/adminSlice';
import { MagnifyingGlassIcon, CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';

export const UserApprovals = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { users, pendingPortfolios, fetchUsers: fetchUsersState, manageUser, managePortfolio } = useAppSelector(
    (state) => state.admin
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'users' | 'portfolios'>('users');

  useEffect(() => {
    void dispatch(fetchUsers(roleFilter));
    void dispatch(fetchPendingPortfolios());
  }, [dispatch, roleFilter]);

  const handleApproveUser = async (userId: string) => {
    await dispatch(approveUser(userId));
    void dispatch(fetchUsers(roleFilter));
  };

  const handleSetAdmin = async (userId: string) => {
    if (confirm(t('admin.approvals.confirmAdmin'))) {
      await dispatch(updateUserRole({ userId, role: 'admin' }));
      void dispatch(fetchUsers(roleFilter));
    }
  };

  const handleApprovePortfolio = async (portfolioId: string) => {
    await dispatch(approvePortfolio(portfolioId));
    void dispatch(fetchPendingPortfolios());
  };

  const handleRejectPortfolio = async (portfolioId: string) => {
    if (confirm(t('admin.approvals.confirmReject'))) {
      await dispatch(rejectPortfolio(portfolioId));
      void dispatch(fetchPendingPortfolios());
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'users' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          {t('admin.approvals.users')}
        </button>
        <button
          onClick={() => setActiveTab('portfolios')}
          className={`px-6 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'portfolios' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          {t('admin.approvals.portfolios')} ({pendingPortfolios.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('admin.approvals.search')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">{t('admin.approvals.allRoles')}</option>
              <option value="homeowner">{t('admin.approvals.homeowners')}</option>
              <option value="provider">{t('admin.approvals.providers')}</option>
              <option value="admin">{t('admin.approvals.admins')}</option>
            </select>
          </div>

          {fetchUsersState.status === 'pending' ? (
            <div className="flex items-center justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-gray-200 border-t-red-500 rounded-full"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{user.username}</h3>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : user.role === 'provider'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.role}
                        </span>
                        {!user.isApproved && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {t('admin.approvals.pending')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    {!user.isApproved && (
                      <button
                        onClick={() => handleApproveUser(user.id)}
                        disabled={manageUser.status === 'pending'}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        {t('admin.approvals.approve')}
                      </button>
                    )}
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => handleSetAdmin(user.id)}
                        disabled={manageUser.status === 'pending'}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                      >
                        <UserIcon className="w-4 h-4" />
                        {t('admin.approvals.setAdmin')}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'portfolios' && (
        <div className="space-y-4">
          {pendingPortfolios.map((portfolio, index) => (
            <motion.div
              key={portfolio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{portfolio.title}</h3>
                  <p className="text-sm text-gray-500">
                    {t('admin.approvals.by')} {portfolio.username}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(portfolio.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprovePortfolio(portfolio.id)}
                    disabled={managePortfolio.status === 'pending'}
                    className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4" />
                    {t('admin.approvals.approve')}
                  </button>
                  <button
                    onClick={() => handleRejectPortfolio(portfolio.id)}
                    disabled={managePortfolio.status === 'pending'}
                    className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    {t('admin.approvals.reject')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {pendingPortfolios.length === 0 && (
            <div className="text-center py-12 text-gray-500">{t('admin.approvals.noPending')}</div>
          )}
        </div>
      )}
    </div>
  );
};
