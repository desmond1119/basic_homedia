/**
 * Auth Slice
 * Redux state management for authentication
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthRepository } from '../infrastructure/AuthRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { AppUser, AuthSession, LoginCredentials, ProviderTypeOption, RegisterData } from '../domain/Auth.types';

interface AuthState {
  user: AppUser | null;
  session: AuthSession | null;
  providerTypes: ProviderTypeOption[];
  isAuthenticated: boolean;
  isInitialized: boolean;
  register: AsyncState;
  login: AsyncState;
  logout: AsyncState;
  checkSession: AsyncState;
  fetchProviderTypes: AsyncState;
}

const initialState: AuthState = {
  user: null,
  session: null,
  providerTypes: [],
  isAuthenticated: false,
  isInitialized: false,
  register: initialAsyncState,
  login: initialAsyncState,
  logout: initialAsyncState,
  checkSession: initialAsyncState,
  fetchProviderTypes: initialAsyncState,
};

const authRepository = new AuthRepository();

// Async Thunks
export const registerUser = createAsyncThunkWithError<AuthSession, RegisterData>(
  'auth/register',
  async (data: RegisterData) => {
    return await authRepository.register(data);
  }
);

export const loginUser = createAsyncThunkWithError<AuthSession, LoginCredentials>(
  'auth/login',
  async (credentials: LoginCredentials) => {
    return await authRepository.login(credentials);
  }
);

export const logoutUser = createAsyncThunkWithError<boolean, void>(
  'auth/logout',
  async () => {
    return await authRepository.logout();
  }
);

export const checkAuthSession = createAsyncThunkWithError<AuthSession | null, void>(
  'auth/checkSession',
  async () => {
    return await authRepository.getCurrentSession();
  }
);

export const fetchProviderTypes = createAsyncThunkWithError<ProviderTypeOption[], void>(
  'auth/fetchProviderTypes',
  async () => {
    return await authRepository.getProviderTypes();
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.register.error = null;
      state.login.error = null;
      state.logout.error = null;
    },
    setUser: (state, action: PayloadAction<AppUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = action.payload !== null;
    },
    setAuthUser: (state, action: PayloadAction<{id: string; email: string | null; username?: string | null; role?: string; avatarUrl?: string | null}>) => {
      state.user = action.payload as AppUser;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearAuthUser: (state) => {
      state.user = null;
      state.session = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.register.status = 'pending';
        state.register.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.register.status = 'succeeded';
        state.session = action.payload;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.register.status = 'failed';
        state.register.error = action.payload?.message ?? 'Registration failed';
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.login.status = 'pending';
        state.login.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.login.status = 'succeeded';
        state.session = action.payload;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.login.status = 'failed';
        state.login.error = action.payload?.message ?? 'Login failed';
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.logout.status = 'pending';
        state.logout.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.logout.status = 'succeeded';
        state.session = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.logout.status = 'failed';
        state.logout.error = action.payload?.message ?? 'Logout failed';
      });

    // Check Session
    builder
      .addCase(checkAuthSession.pending, (state) => {
        state.checkSession.status = 'pending';
        state.checkSession.error = null;
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.checkSession.status = 'succeeded';
        if (action.payload) {
          state.session = action.payload;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        } else {
          state.session = null;
          state.user = null;
          state.isAuthenticated = false;
        }
        state.isInitialized = true;
      })
      .addCase(checkAuthSession.rejected, (state, action) => {
        state.checkSession.status = 'failed';
        state.checkSession.error = action.payload?.message ?? 'Session check failed';
        state.isInitialized = true;
        state.isAuthenticated = false;
      });

    // Fetch Provider Types
    builder
      .addCase(fetchProviderTypes.pending, (state) => {
        state.fetchProviderTypes.status = 'pending';
        state.fetchProviderTypes.error = null;
      })
      .addCase(fetchProviderTypes.fulfilled, (state, action) => {
        state.fetchProviderTypes.status = 'succeeded';
        state.providerTypes = action.payload;
      })
      .addCase(fetchProviderTypes.rejected, (state, action) => {
        state.fetchProviderTypes.status = 'failed';
        state.fetchProviderTypes.error = action.payload?.message ?? 'Failed to fetch provider types';
      });
  },
});

export const { clearError, setUser, setAuthUser, clearAuthUser } = authSlice.actions;
export const authReducer = authSlice.reducer;
