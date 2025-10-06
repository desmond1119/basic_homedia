import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useAppDispatch } from '@/core/store/hooks';
import { registerUser } from '../store/authSlice';

export const PinterestRegisterPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError(t('auth.register.errors.passwordMismatch'));
      setIsLoading(false);
      return;
    }

    try {
      const result = await dispatch(registerUser({
        email,
        password,
        username,
        role: 'homeowner',
        fullName: username,
      })).unwrap();
      
      setSuccess(true);
      
      // Role-based redirect
      const redirectPath = result.user.role === 'admin' 
        ? '/admin' 
        : result.user.role === 'provider'
        ? '/profile/' + result.user.id
        : result.user.role === 'homeowner'
        ? '/profile/' + result.user.id
        : '/inspiration';
      
      setTimeout(() => {
        navigate(redirectPath);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      const isRecursionError = errorMessage.includes('infinite recursion') || 
                               errorMessage.includes('policy for relation');
      
      if (!isRecursionError && errorMessage) {
        if (errorMessage === 'USERNAME_TAKEN' || errorMessage.includes('duplicate key')) {
          setError(t('auth.register.errors.usernameTaken'));
        } else {
          setError(errorMessage);
        }
      } else if (!isRecursionError) {
        setError(t('auth.register.error'));
      }
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
              className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4"
            >
              H
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('auth.register.title')}
            </h1>
            <p className="text-gray-600">
              {t('auth.register.subtitle')}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl"
            >
              {t('auth.register.success')}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                placeholder={t('auth.register.usernamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.email')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                placeholder={t('auth.register.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                  placeholder="••••••••"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.register.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-300 transition-all duration-200"
                placeholder="••••••••"
              />
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
                {t('auth.register.success')}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.register.creating') : t('auth.register.submit')}
            </motion.button>

            <div className="text-center">
              <p className="text-gray-600">
                {t('auth.register.hasAccount')}{' '}
                <a href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  {t('auth.register.login')}
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-primary-50 to-accent-pink">
        <div className="h-full flex items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              {t('auth.register.hero.title') || 'Start Your Renovation Journey'}
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {t('auth.register.hero.subtitle') || 'Connect with top professionals and get inspired'}
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
