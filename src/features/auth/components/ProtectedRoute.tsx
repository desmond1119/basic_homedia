/**
 * Protected Route Component
 * Restricts access to authenticated users
 */

import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/core/store/hooks';
import { checkAuthSession } from '../store/authSlice';
import { UserRole } from '../domain/Auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
