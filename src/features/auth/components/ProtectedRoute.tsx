/**
 * Protected Route Component
 * Restricts access to authenticated users
 */

import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { checkAuthSession } from '../store/authSlice';
import { UserRole } from '../domain/Auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { isAuthenticated, isInitialized, user, checkSession } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      void dispatch(checkAuthSession());
    }
  }, [dispatch, isInitialized]);

  // Show loading while checking session
  if (!isInitialized || checkSession.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-6">🚫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('auth.accessDenied.title')}</h2>
          <p className="text-gray-600 mb-6">{t('auth.accessDenied.message')}</p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition-colors"
          >
            {t('auth.accessDenied.goBack')}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
