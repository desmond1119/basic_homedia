import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
import {
  Provider,
  ProviderFilters,
  fetchProvidersThunk,
  approveProviderThunk,
  followProviderThunk,
  collectProviderThunk,
} from '../infrastructure/ProviderThunks';

interface ProviderState {
  providers: Provider[];
  currentProvider: Provider | null;
  filters: ProviderFilters;
  loading: boolean;
  hasMore: boolean;
  total: number;
  page: number;
  error: string | null;
  followedProviders: Set<string>;
  collectedProviders: Set<string>;
}

const initialState: ProviderState = {
  providers: [],
  currentProvider: null,
  filters: {
    sortBy: 'rating',
  },
  loading: false,
  hasMore: true,
  total: 0,
  page: 1,
  error: null,
  followedProviders: new Set(),
  collectedProviders: new Set(),
};

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProviderFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.page = 1;
      state.providers = [];
      state.hasMore = true;
    },
    setCurrentProvider: (state, action: PayloadAction<Provider | null>) => {
      state.currentProvider = action.payload;
    },
    updateProviderLocally: (state, action: PayloadAction<Provider>) => {
      const index = state.providers.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.providers[index] = action.payload;
      }
      if (state.currentProvider?.id === action.payload.id) {
        state.currentProvider = action.payload;
      }
    },
    toggleFollowLocally: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      if (state.followedProviders.has(providerId)) {
        state.followedProviders.delete(providerId);
        const provider = state.providers.find(p => p.id === providerId);
        if (provider) {
          provider.follower_count = Math.max(0, provider.follower_count - 1);
        }
      } else {
        state.followedProviders.add(providerId);
        const provider = state.providers.find(p => p.id === providerId);
        if (provider) {
          provider.follower_count++;
        }
      }
    },
    toggleCollectLocally: (state, action: PayloadAction<string>) => {
      const providerId = action.payload;
      if (state.collectedProviders.has(providerId)) {
        state.collectedProviders.delete(providerId);
      } else {
        state.collectedProviders.add(providerId);
      }
    },
    resetProviders: () => initialState,
    incrementPage: (state) => {
      state.page++;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch providers
      .addCase(fetchProvidersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProvidersThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.isSuccess()) {
          const { providers, total } = action.payload.getValue();
          if (state.page === 1) {
            state.providers = providers;
          } else {
            // Avoid duplicates
            const existingIds = new Set(state.providers.map(p => p.id));
            const newProviders = providers.filter(p => !existingIds.has(p.id));
            state.providers = [...state.providers, ...newProviders];
          }
          state.total = total;
          state.hasMore = state.providers.length < total;
        } else {
          state.error = action.payload.getError();
        }
      })
      .addCase(fetchProvidersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch providers';
      })
      // Approve provider
      .addCase(approveProviderThunk.fulfilled, (state, action) => {
        if (action.payload.isSuccess()) {
          const approvedProvider = action.payload.getValue();
          const index = state.providers.findIndex(p => p.id === approvedProvider.id);
          if (index !== -1) {
            state.providers[index] = { ...state.providers[index], is_approved: true };
          }
        }
      })
      // Follow provider
      .addCase(followProviderThunk.pending, (state, action) => {
        // Optimistic update
        const providerId = action.meta.arg;
        providerSlice.caseReducers.toggleFollowLocally(state, { 
          type: 'toggleFollowLocally', 
          payload: providerId 
        });
      })
      .addCase(followProviderThunk.rejected, (state, action) => {
        // Revert optimistic update on error
        const providerId = action.meta.arg;
        providerSlice.caseReducers.toggleFollowLocally(state, { 
          type: 'toggleFollowLocally', 
          payload: providerId 
        });
      })
      // Collect provider
      .addCase(collectProviderThunk.pending, (state, action) => {
        // Optimistic update
        const providerId = action.meta.arg;
        providerSlice.caseReducers.toggleCollectLocally(state, { 
          type: 'toggleCollectLocally', 
          payload: providerId 
        });
      })
      .addCase(collectProviderThunk.rejected, (state, action) => {
        // Revert optimistic update on error
        const providerId = action.meta.arg;
        providerSlice.caseReducers.toggleCollectLocally(state, { 
          type: 'toggleCollectLocally', 
          payload: providerId 
        });
      });
  },
});

export const {
  setFilters,
  setCurrentProvider,
  updateProviderLocally,
  toggleFollowLocally,
  toggleCollectLocally,
  resetProviders,
  incrementPage,
} = providerSlice.actions;

export default providerSlice.reducer;

// Realtime subscription setup
export const setupProviderRealtimeSubscription = () => (dispatch: any): (() => void) => {
  const channel = supabase
    .channel('providers_changes')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'provider_profiles' },
      (payload) => {
        // Only add if approved
        if (payload.new && (payload.new as any).is_approved) {
          dispatch(updateProviderLocally(payload.new as Provider));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'provider_profiles' },
      (payload) => {
        dispatch(updateProviderLocally(payload.new as Provider));
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
