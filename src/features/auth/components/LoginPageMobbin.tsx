// Mobbin-style login page with dark theme
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { clearError, loginUser } from '../store/authSlice';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export const LoginPageMobbin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { login, isAuthenticated } = useAppSelector((state) => state.auth);

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
    <div className="min-h-screen bg-black flex">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Language switcher */}
          <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              {t('auth.login.title')}
            </h1>
            <p className="text-shallow mb-8">
              {t('auth.login.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {login.error && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
                >
                  <p className="text-red-400 text-sm">{login.error}</p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('auth.login.email')}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full"
                  placeholder={t('auth.login.emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  {t('auth.login.password')}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field w-full"
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={login.status === 'pending'}
                className="btn-primary w-full group"
              >
                {login.status === 'pending' ? t('auth.login.signingIn') : t('auth.login.submit')}
                <ArrowRightIcon className="inline-block w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center">
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

      {/* Right side - Visual showcase */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        
        <div className="relative z-10 text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl font-bold text-white mb-4"
          >
            {t('hero.title', 'Renovation Platform')}
          </motion.div>
          <p className="text-shallow text-lg max-w-md mx-auto">
            {t('hero.description', 'Modern design system for renovation projects')}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
