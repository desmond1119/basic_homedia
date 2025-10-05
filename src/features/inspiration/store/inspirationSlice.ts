import { createEntityAdapter, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { InspirationRepository } from '../infrastructure/InspirationRepository';
import {
  InspirationFilterState,
  InspirationItem,
  InspirationPage,
  InspirationSortOption,
} from '../domain/Inspiration.types';

const inspirationAdapter = createEntityAdapter<InspirationItem>();

const repository = new InspirationRepository();

interface FetchInspirationArgs {
  readonly page: number;
  readonly filters: InspirationFilterState;
  readonly sort: InspirationSortOption;
  readonly userId?: string;
  readonly reset?: boolean;
}

interface ToggleInteractionPayload {
  readonly id: string;
  readonly collected?: boolean;
  readonly liked?: boolean;
  readonly collectDelta?: number;
  readonly likeDelta?: number;
  readonly following?: boolean;
}

interface InspirationState {
  filters: InspirationFilterState;
  sort: InspirationSortOption;
  orders: Record<InspirationSortOption, string[]>;
  pages: Record<InspirationSortOption, number>;
  hasMore: Record<InspirationSortOption, boolean>;
  fetchFeed: AsyncState;
}

const defaultFilters: InspirationFilterState = {
  ratingMin: 0,
};

const initialState: InspirationState & { entities: Record<string, InspirationItem>; ids: string[] } = {
  ...inspirationAdapter.getInitialState(),
  filters: defaultFilters,
  sort: 'newest',
  orders: {
    newest: [],
    popular: [],
    personalized: [],
  },
  pages: {
    newest: 0,
    popular: 0,
    personalized: 0,
  },
  hasMore: {
    newest: true,
    popular: true,
    personalized: true,
  },
  fetchFeed: initialAsyncState,
};

export const fetchInspirationFeed = createAsyncThunkWithError<InspirationPage, FetchInspirationArgs>(
  'inspiration/fetchFeed',
  async ({ page, filters, sort, userId }) => {
    return await repository.fetchFeed({ page, filters, sort, userId });
  }
);

export const toggleInspirationCollectThunk = createAsyncThunkWithError<
  boolean,
  { id: string; userId: string; shouldCollect: boolean }
>(
  'inspiration/toggleCollect',
  async ({ id, userId, shouldCollect }) => {
    return await repository.toggleCollect(id, userId, shouldCollect);
  }
);

export const toggleInspirationLikeThunk = createAsyncThunkWithError<
  boolean,
  { id: string; userId: string; shouldLike: boolean }
>(
  'inspiration/toggleLike',
  async ({ id, userId, shouldLike }) => {
    return await repository.toggleLike(id, userId, shouldLike);
  }
);

export const toggleInspirationFollowThunk = createAsyncThunkWithError<
  boolean,
  { providerId: string; userId: string; shouldFollow: boolean }
>(
  'inspiration/toggleFollow',
  async ({ providerId, userId, shouldFollow }) => {
    return await repository.toggleFollowProvider(providerId, userId, shouldFollow);
  }
);

const inspirationSlice = createSlice({
  name: 'inspiration',
  initialState,
  reducers: {
    setInspirationFilters: (state, action: PayloadAction<InspirationFilterState>) => {
      state.filters = action.payload;
      state.orders[state.sort] = [];
      state.pages[state.sort] = 0;
      state.hasMore[state.sort] = true;
    },
    setInspirationSort: (state, action: PayloadAction<InspirationSortOption>) => {
      state.sort = action.payload;
    },
    upsertInspirationItem: (state, action: PayloadAction<InspirationItem>) => {
      inspirationAdapter.upsertOne(state, action.payload);
      const order = state.orders[state.sort];
      if (!order.includes(action.payload.id)) {
        order.unshift(action.payload.id);
      }
    },
    removeInspirationItem: (state, action: PayloadAction<string>) => {
      inspirationAdapter.removeOne(state, action.payload);
      (Object.keys(state.orders) as InspirationSortOption[]).forEach((key) => {
        state.orders[key] = state.orders[key].filter((id) => id !== action.payload);
      });
    },
    markInspirationInteraction: (state, action: PayloadAction<ToggleInteractionPayload>) => {
      const { id, collected, liked, collectDelta, likeDelta, following } = action.payload;
      const entity = state.entities[id];
      if (!entity) {
        return;
      }
      if (collected !== undefined) {
        entity.isCollected = collected;
      }
      if (liked !== undefined) {
        entity.isLiked = liked;
      }
      if (collectDelta) {
        entity.stats = {
          ...entity.stats,
          collects: Math.max(0, entity.stats.collects + collectDelta),
        };
      }
      if (likeDelta) {
        entity.stats = {
          ...entity.stats,
          likes: Math.max(0, entity.stats.likes + likeDelta),
        };
      }
      if (following !== undefined) {
        entity.provider = {
          ...entity.provider,
          isFollowing: following,
        };
      }
    },
    resetInspirationState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInspirationFeed.pending, (state) => {
        state.fetchFeed.status = 'pending';
        state.fetchFeed.error = null;
      })
      .addCase(fetchInspirationFeed.fulfilled, (state, action) => {
        state.fetchFeed.status = 'succeeded';
        const { items, hasMore, nextPage } = action.payload;
        inspirationAdapter.upsertMany(state, items);

        const sortKey = action.meta.arg.sort;
        const isReset = Boolean(action.meta.arg.reset);

        if (isReset) {
          state.orders[sortKey] = [];
        }

        const updatedOrder = isReset ? [] : [...state.orders[sortKey]];
        for (const item of items) {
          if (!updatedOrder.includes(item.id)) {
            updatedOrder.push(item.id);
          }
        }
        state.orders[sortKey] = updatedOrder;
        state.hasMore[sortKey] = hasMore;
        state.pages[sortKey] = nextPage ?? action.meta.arg.page;
        state.filters = action.meta.arg.filters;
        state.sort = sortKey;
      })
      .addCase(fetchInspirationFeed.rejected, (state, action) => {
        state.fetchFeed.status = 'failed';
        state.fetchFeed.error = action.payload?.message ?? 'Failed to load inspiration feed';
      })
      .addCase(toggleInspirationCollectThunk.fulfilled, (state, action) => {
        const { id, shouldCollect } = action.meta.arg;
        const entity = state.entities[id];
        if (!entity) {
          return;
        }
        entity.isCollected = shouldCollect;
        const delta = shouldCollect ? 1 : -1;
        entity.stats = {
          ...entity.stats,
          collects: Math.max(0, entity.stats.collects + delta),
        };
      })
      .addCase(toggleInspirationLikeThunk.fulfilled, (state, action) => {
        const { id, shouldLike } = action.meta.arg;
        const entity = state.entities[id];
        if (!entity) {
          return;
        }
        entity.isLiked = shouldLike;
        const delta = shouldLike ? 1 : -1;
        entity.stats = {
          ...entity.stats,
          likes: Math.max(0, entity.stats.likes + delta),
        };
      })
      .addCase(toggleInspirationFollowThunk.fulfilled, (state, action) => {
        const { providerId } = action.meta.arg;
        const isFollowing = action.payload;
        for (const inspirationId of state.ids) {
          if (typeof inspirationId !== 'string') {
            continue;
          }
          const entity = state.entities[inspirationId];
          if (!entity) {
            continue;
          }
          if (entity.provider.id === providerId) {
            entity.provider = {
              ...entity.provider,
              isFollowing,
            };
          }
        }
      });
  },
});

export const {
  setInspirationFilters,
  setInspirationSort,
  upsertInspirationItem,
  removeInspirationItem,
  markInspirationInteraction,
  resetInspirationState,
} = inspirationSlice.actions;

export const inspirationReducer = inspirationSlice.reducer;

interface InspirationRootState {
  inspiration: typeof initialState;
}

export const {
  selectById: selectInspirationById,
  selectIds: selectInspirationIds,
  selectEntities: selectInspirationEntities,
  selectAll: selectAllInspiration,
} = inspirationAdapter.getSelectors<InspirationRootState>((state) => state.inspiration);

export const selectInspirationOrder = (
  state: InspirationRootState,
  sort: InspirationSortOption
): string[] => state.inspiration.orders[sort];

export const selectInspirationHasMore = (
  state: InspirationRootState,
  sort: InspirationSortOption
): boolean => state.inspiration.hasMore[sort];

export const selectInspirationPage = (
  state: InspirationRootState,
  sort: InspirationSortOption
): number => state.inspiration.pages[sort];

export const selectInspirationFilters = (state: InspirationRootState): InspirationFilterState =>
  state.inspiration.filters;

export const selectInspirationSortState = (state: InspirationRootState): InspirationSortOption =>
  state.inspiration.sort;

export const selectInspirationFetchState = (state: InspirationRootState): AsyncState =>
  state.inspiration.fetchFeed;
