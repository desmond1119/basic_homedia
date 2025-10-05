import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { authReducer, registerUser, loginUser, logoutUser, checkAuthSession, setAuthUser, clearAuthUser } from '../authSlice';
import * as AuthRepositoryModule from '../../infrastructure/AuthRepository';

vi.mock('../../infrastructure/AuthRepository');

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;
  
  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  describe('reducers', () => {
    it('should handle setAuthUser', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        username: 'testuser',
        role: 'homeowner' as const,
        avatarUrl: null,
      };

      store.dispatch(setAuthUser(user));
      
      const state = store.getState().auth;
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle clearAuthUser', () => {
      store.dispatch(setAuthUser({
        id: 'test-id',
        email: 'test@example.com',
        username: 'testuser',
        role: 'homeowner',
        avatarUrl: null,
      }));

      store.dispatch(clearAuthUser());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('registerUser thunk', () => {
    it('should handle successful registration', async () => {
      const mockSession = {
        user: {
          id: 'user-123',
          email: 'new@example.com',
          username: 'newuser',
          role: 'homeowner',
        },
        session: { access_token: 'token', refresh_token: 'refresh' },
      };

      const mockRegister = vi.fn().mockResolvedValue(mockSession);
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        register: mockRegister,
      } as any));

      const registerData = {
        email: 'new@example.com',
        password: 'password123',
        username: 'newuser',
        role: 'homeowner' as const,
        full_name: 'New User',
      };

      await store.dispatch(registerUser(registerData));

      const state = store.getState().auth;
      expect(state.register.status).toBe('succeeded');
      expect(state.user).toEqual(mockSession.user);
      expect(state.isAuthenticated).toBe(true);
      expect(mockRegister).toHaveBeenCalledWith(registerData);
    });

    it('should handle registration failure', async () => {
      const mockRegister = vi.fn().mockRejectedValue(new Error('Registration failed'));
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        register: mockRegister,
      } as any));

      await store.dispatch(registerUser({
        email: 'fail@example.com',
        password: 'password123',
        username: 'failuser',
        role: 'homeowner',
        full_name: 'Fail User',
      }));

      const state = store.getState().auth;
      expect(state.register.status).toBe('failed');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('loginUser thunk', () => {
    it('should handle successful login', async () => {
      const mockSession = {
        user: {
          id: 'user-456',
          email: 'login@example.com',
          username: 'loginuser',
          role: 'homeowner',
        },
        session: { access_token: 'token', refresh_token: 'refresh' },
      };

      const mockLogin = vi.fn().mockResolvedValue(mockSession);
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        login: mockLogin,
      } as any));

      await store.dispatch(loginUser({
        email: 'login@example.com',
        password: 'password123',
      }));

      const state = store.getState().auth;
      expect(state.login.status).toBe('succeeded');
      expect(state.user).toEqual(mockSession.user);
      expect(state.isAuthenticated).toBe(true);
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'login@example.com',
        password: 'password123',
      });
    });

    it('should handle login failure', async () => {
      const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        login: mockLogin,
      } as any));

      await store.dispatch(loginUser({
        email: 'wrong@example.com',
        password: 'wrongpass',
      }));

      const state = store.getState().auth;
      expect(state.login.status).toBe('failed');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logoutUser thunk', () => {
    it('should handle successful logout', async () => {
      store.dispatch(setAuthUser({
        id: 'user-789',
        email: 'logout@example.com',
        username: 'logoutuser',
        role: 'homeowner',
        avatarUrl: null,
      }));

      const mockLogout = vi.fn().mockResolvedValue(true);
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        logout: mockLogout,
      } as any));

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.logout.status).toBe('succeeded');
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle logout failure', async () => {
      const mockLogout = vi.fn().mockRejectedValue(new Error('Logout failed'));
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        logout: mockLogout,
      } as any));

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.logout.status).toBe('failed');
    });
  });

  describe('checkAuthSession thunk', () => {
    it('should handle existing session', async () => {
      const mockSession = {
        user: {
          id: 'user-999',
          email: 'session@example.com',
          username: 'sessionuser',
          role: 'provider',
        },
        session: { access_token: 'token', refresh_token: 'refresh' },
      };

      const mockGetCurrentSession = vi.fn().mockResolvedValue(mockSession);
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        getCurrentSession: mockGetCurrentSession,
      } as any));

      await store.dispatch(checkAuthSession());

      const state = store.getState().auth;
      expect(state.checkSession.status).toBe('succeeded');
      expect(state.user).toEqual(mockSession.user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle no session', async () => {
      const mockGetCurrentSession = vi.fn().mockResolvedValue(null);
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        getCurrentSession: mockGetCurrentSession,
      } as any));

      await store.dispatch(checkAuthSession());

      const state = store.getState().auth;
      expect(state.checkSession.status).toBe('succeeded');
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });

    it('should handle session check failure', async () => {
      const mockGetCurrentSession = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.spyOn(AuthRepositoryModule, 'AuthRepository').mockImplementation(() => ({
        getCurrentSession: mockGetCurrentSession,
      } as any));

      await store.dispatch(checkAuthSession());

      const state = store.getState().auth;
      expect(state.checkSession.status).toBe('failed');
      expect(state.isAuthenticated).toBe(false);
      expect(state.isInitialized).toBe(true);
    });
  });
});
