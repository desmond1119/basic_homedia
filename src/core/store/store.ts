import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '@/features/auth/store/authSlice';
import providerReducer from '@/features/provider/application/providerSlice';
import { portfolioReducer } from '@/features/portfolio/store/portfolioSlice';
import { profileStatsReducer } from '@/features/profile/store/profileStatsSlice';
import { userProfileReducer } from '@/features/profile/store/profileSlice';
import forumReducer from '@/features/forum/application/forumSlice';
import { forumApi } from '@/features/forum/api/forumApi';
import { inspirationReducer } from '@/features/inspiration/store/inspirationSlice';
import { adminReducer } from '@/features/admin/store/adminSlice';
import { setupListeners } from '@reduxjs/toolkit/query';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    provider: providerReducer,
    portfolio: portfolioReducer,
    profileStats: profileStatsReducer,
    userProfile: userProfileReducer,
    forum: forumReducer,
    inspiration: inspirationReducer,
    admin: adminReducer,
    [forumApi.reducerPath]: forumApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(forumApi.middleware),
  devTools: import.meta.env.DEV,
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
