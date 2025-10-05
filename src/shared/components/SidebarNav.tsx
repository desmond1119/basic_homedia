import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  SparklesIcon,
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ChatBubbleLeftRightIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth/context/AuthContext';

interface NavItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  roles?: ('homeowner' | 'provider' | 'admin')[];
}

export const SidebarNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/inspiration');
  };

  const navItems: NavItem[] = [
    {
      key: 'inspiration',
      icon: SparklesIcon,
      label: t('nav.inspiration'),
      path: '/inspiration',
    },
    {
      key: 'browse',
      icon: Squares2X2Icon,
      label: t('nav.browse'),
      path: '/providers',
    },
    {
      key: 'forum',
      icon: ChatBubbleLeftRightIcon,
      label: t('nav.forum'),
      path: '/forum',
    },
    {
      key: 'profile',
      icon: UserCircleIcon,
      label: t('nav.profile'),
      path: `/profile/${user?.id || ''}`,
      roles: ['homeowner', 'provider', 'admin'],
    },
    {
      key: 'collections',
      icon: HeartIcon,
      label: t('nav.collections'),
      path: '/collections',
      roles: ['homeowner'],
    },
    {
      key: 'demands',
      icon: ClipboardDocumentListIcon,
      label: t('nav.demands'),
      path: '/demands',
      roles: ['homeowner'],
    },
    {
      key: 'upload',
      icon: CloudArrowUpIcon,
      label: t('nav.upload'),
      path: '/portfolio/upload',
      roles: ['provider'],
    },
    {
      key: 'analytics',
      icon: ChartBarIcon,
      label: t('nav.analytics'),
      path: '/analytics',
      roles: ['provider', 'admin'],
    },
    {
      key: 'messages',
      icon: ChatBubbleLeftRightIcon,
      label: t('nav.messages'),
      path: '/messages',
      roles: ['homeowner', 'provider', 'admin'],
    },
    {
      key: 'manage',
      icon: ShieldCheckIcon,
      label: t('nav.manage'),
      path: '/admin/manage',
      roles: ['admin'],
    },
    {
      key: 'settings',
      icon: Cog6ToothIcon,
      label: t('nav.settings'),
      path: '/settings',
      roles: ['homeowner', 'provider', 'admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!isAuthenticated) return false;
    const userRole = user?.role;
    if (!userRole || userRole === 'guest') return false;
    return item.roles.includes(userRole);
  });

  const isActive = (path: string) => {
    if (path === '/inspiration') return location.pathname === '/' || location.pathname === '/inspiration';
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 flex flex-col shadow-lg"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="p-6 border-b border-gray-200">
        <motion.div
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/inspiration')}
          className="flex items-center gap-3 cursor-pointer mb-6"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
            H
          </div>
          <span className="text-gray-900 font-bold text-xl">Homedia</span>
        </motion.div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('nav.search')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <motion.button
              key={item.key}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all group ${
                active
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </motion.button>
          );
        })}

        {!isAuthenticated && (
          <>
            <div className="h-px bg-gray-200 my-4" />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-md"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              {t('nav.login')}
            </motion.button>
          </>
        )}
      </div>

      {isAuthenticated && user && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold cursor-pointer shadow-md"
            >
              {user.username?.[0]?.toUpperCase() || 'U'}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 font-medium text-sm truncate">{user.username}</p>
              <p className="text-gray-500 text-xs">{user.role}</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium text-sm">{t('nav.logout')}</span>
          </motion.button>
        </div>
      )}
    </motion.nav>
  );
};
