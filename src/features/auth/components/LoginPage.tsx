import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { clearError, loginUser } from '../store/authSlice';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login, isAuthenticated } = useAppSelector((state) => state.auth);
  const loginErrorMessage = login.error
    ? (login.error.toLowerCase().includes('duplicate') || login.error.toLowerCase().includes('already exists')
        ? t('error.duplicateProfile')
        : login.error)
    : null;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/forum');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginUser({
      email: formData.email,
      password: formData.password,
    }));
    if (loginUser.fulfilled.match(result)) {
      navigate('/forum');
    }
  };

  return (
    <div className="min-h-screen bg-black flex font-['Inter']">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl font-bold text-white mb-3">
              {t('auth.login.title')}
            </h1>
            <p className="text-gray-400 mb-12 text-lg">
              {t('auth.login.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {loginErrorMessage && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-xl p-4"
                >
                  <p className="text-red-400 text-sm">{loginErrorMessage}</p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  {t('auth.login.email')}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder={t('auth.login.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  {t('auth.login.password')}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-4 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-white focus:border-transparent transition-all"
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={login.status === 'pending'}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors group"
              >
                {login.status === 'pending' ? t('auth.login.signingIn') : t('auth.login.submit')}
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  {t('auth.login.noAccount')} <span className="text-white font-semibold">{t('auth.login.register')}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center max-w-lg">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-7xl font-bold text-white mb-6 leading-tight"
          >
            {t('hero.title', 'Renovation Platform')}
          </motion.div>
          <p className="text-gray-400 text-xl leading-relaxed">
            {t('hero.description', 'Modern design system for renovation projects')}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
