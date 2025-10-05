import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export const PinterestLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await login(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/inspiration');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
            >
              H
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.login.welcomeBack')}
            </h1>
            <p className="text-gray-600">
              {t('auth.login.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                placeholder={t('auth.login.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {t('auth.login.success')}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                {t('auth.login.forgotPassword')}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {t('auth.login.or')}
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-gray-600">
                {t('auth.login.noAccount')}{' '}
                <a href="/register" className="text-red-600 hover:text-red-700 font-medium">
                  {t('auth.login.signUpLink')}
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('auth.login.hero.title')}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('auth.login.hero.subtitle')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="w-full h-32 bg-gray-200 rounded-xl mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="w-full h-32 bg-gray-200 rounded-xl mb-3"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
