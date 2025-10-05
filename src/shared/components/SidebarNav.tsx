import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  FolderIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  PlusCircleIcon,
  ChartBarIcon,
  CheckCircleIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useAppSelector, useAppDispatch } from '@/core/store/hooks';
import { logoutUser } from '@/features/auth/store/authSlice';

interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: string[];
  children?: NavItem[];
}

export const SidebarNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(false);

  const handleLogout = () => {
    void dispatch(logoutUser());
    navigate('/');
    setIsOpen(false);
  };

  const navItems: NavItem[] = [
    {
      key: 'home',
      icon: <HomeIcon className="w-5 h-5" />,
      label: t('nav.home'),
      path: '/',
    },
    {
      key: 'providers',
      icon: <BuildingOfficeIcon className="w-5 h-5" />,
      label: t('nav.browseProviders'),
      path: '/providers',
    },
    {
      key: 'categories',
      icon: <FolderIcon className="w-5 h-5" />,
      label: t('nav.categoriesMenu'),
      path: '#',
      children: [
        { key: 'sleeproom', icon: null, label: t('nav.categories.sleeproom'), path: '/?category=sleeproom' },
        { key: 'kitchen', icon: null, label: t('nav.categories.kitchen'), path: '/?category=kitchen' },
        { key: 'living', icon: null, label: t('nav.categories.living'), path: '/?category=living' },
        { key: 'bathroom', icon: null, label: t('nav.categories.bathroom'), path: '/?category=bathroom' },
      ],
    },
    {
      key: 'profile',
      icon: <UserCircleIcon className="w-5 h-5" />,
      label: t('nav.profile'),
      path: `/profile/${user?.id}`,
      roles: ['homeowner', 'provider'],
    },
    {
      key: 'collections',
      icon: <HeartIcon className="w-5 h-5" />,
      label: t('nav.collections'),
      path: `/profile/${user?.id}/collections`,
      roles: ['homeowner'],
    },
    {
      key: 'demands',
      icon: <ClipboardDocumentListIcon className="w-5 h-5" />,
      label: t('nav.demands'),
      path: '/demands',
      roles: ['homeowner'],
    },
    {
      key: 'uploadPortfolio',
      icon: <PlusCircleIcon className="w-5 h-5" />,
      label: t('nav.uploadPortfolio'),
      path: '/portfolio/upload',
      roles: ['provider'],
    },
    {
      key: 'analytics',
      icon: <ChartBarIcon className="w-5 h-5" />,
      label: t('nav.analytics'),
      path: '/analytics',
      roles: ['provider', 'admin'],
    },
    {
      key: 'messages',
      icon: <ChatBubbleLeftIcon className="w-5 h-5" />,
      label: t('nav.messages'),
      path: '/messages',
      roles: ['homeowner', 'provider'],
    },
    {
      key: 'manageCategories',
      icon: <FolderIcon className="w-5 h-5" />,
      label: t('nav.manageCategories'),
      path: '/admin/categories',
      roles: ['admin'],
    },
    {
      key: 'approve',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      label: t('nav.approve'),
      path: '/admin/approve',
      roles: ['admin'],
    },
    {
      key: 'usersList',
      icon: <UsersIcon className="w-5 h-5" />,
      label: t('nav.usersList'),
      path: '/admin/users',
      roles: ['admin'],
    },
    {
      key: 'settings',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      label: t('nav.settings'),
      path: '/settings',
      roles: ['homeowner', 'provider', 'admin'],
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (!isAuthenticated) return false;
    return item.roles.includes(user?.role || '');
  });

  const handleNavClick = (path: string) => {
    if (path !== '#') {
      navigate(path);
      setIsOpen(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white rounded-xl border border-gray-200 text-gray-900 shadow-lg"
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {(isOpen || window.innerWidth >= 1024) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />

            <motion.nav
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-gray-200 z-50 flex flex-col shadow-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div className="p-6 border-b border-gray-200">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleNavClick('/')}
                  className="flex items-center gap-3 cursor-pointer mb-4"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                    H
                  </div>
                  <span className="text-gray-900 font-bold text-xl">Homedia</span>
                </motion.div>

                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('nav.searchPlaceholder')}
                    className="search-bar"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
                {filteredItems.map((item) => (
                  <div key={item.key}>
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (item.children) {
                          setExpandedCategories(!expandedCategories);
                        } else {
                          handleNavClick(item.path);
                        }
                      }}
                      className={`nav-item mb-1 ${
                        isActive(item.path) ? 'active' : ''
                      }`}
                    >
                      {item.icon}
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {item.children && (
                        <ChevronDownIcon
                          className={`w-4 h-4 transition-transform ${expandedCategories ? 'rotate-180' : ''}`}
                        />
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {item.children && expandedCategories && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-8 overflow-hidden"
                        >
                          {item.children.map((child) => (
                            <motion.button
                              key={child.key}
                              whileHover={{ x: 4 }}
                              onClick={() => handleNavClick(child.path)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              {child.label}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {!isAuthenticated && (
                  <>
                    <div className="h-px bg-gray-200 my-4" />
                    <motion.button
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavClick('/login')}
                      className="nav-item mb-1"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span className="font-medium">{t('nav.login')}</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleNavClick('/signup')}
                      className="btn-primary w-full"
                    >
                      {t('nav.signup')}
                    </motion.button>
                  </>
                )}
              </div>

              {isAuthenticated && (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      onClick={() => handleNavClick(`/profile/${user?.id}`)}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold cursor-pointer"
                    >
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium text-sm truncate">{user?.username}</p>
                      <p className="text-gray-500 text-xs">{user?.role}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsDark(!isDark)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">{t('nav.logout')}</span>
                  </motion.button>
                </div>
              )}
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
