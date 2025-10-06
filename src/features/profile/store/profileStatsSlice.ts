import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { ProfileStatsRepositoryFixed as ProfileStatsRepository } from '../infrastructure/ProfileStatsRepositoryFixed';
import { UserStats, CollectedImage, FollowedCompany, CollectionTab, UpdateProfileData } from '../domain/Profile.types';

interface ProfileStatsState {
  stats: UserStats | null;
  collectedImages: CollectedImage[];
  followedCompanies: FollowedCompany[];
  activeTab: CollectionTab;
  hasMoreImages: boolean;
  hasMoreCompanies: boolean;
  isEditModalOpen: boolean;
  editData: UpdateProfileData;
  fetchStats: AsyncState;
  fetchCollections: AsyncState;
  updateProfile: AsyncState;
}

const initialState: ProfileStatsState = {
  stats: null,
  collectedImages: [],
  followedCompanies: [],
  activeTab: 'images',
  hasMoreImages: true,
  hasMoreCompanies: true,
  isEditModalOpen: false,
  editData: {},
  fetchStats: initialAsyncState,
  fetchCollections: initialAsyncState,
  updateProfile: initialAsyncState,
};

const repository = new ProfileStatsRepository();

export const fetchUserStats = createAsyncThunk<UserStats, string>(
  'profileStats/fetchUserStats',
  async (userId) => await repository.fetchUserStats(userId)
);

export const fetchCollectedImages = createAsyncThunk<
  CollectedImage[],
  { userId: string; limit?: number; offset?: number }
>(
  'profileStats/fetchCollectedImages',
  async ({ userId, limit = 20, offset = 0 }) =>
    await repository.fetchCollectedImages(userId, limit, offset)
);

export const fetchFollowedCompanies = createAsyncThunk<
  FollowedCompany[],
  { userId: string; limit?: number; offset?: number }
>(
  'profileStats/fetchFollowedCompanies',
  async ({ userId, limit = 20, offset = 0 }) =>
    await repository.fetchFollowedCompanies(userId, limit, offset)
);

const profileStatsSlice = createSlice({
  name: 'profileStats',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<CollectionTab>) => {
      state.activeTab = action.payload;
    },
    openEditModal: (state) => {
      state.isEditModalOpen = true;
      if (state.stats) {
        state.editData = {
          username: state.stats.username,
          fullName: state.stats.fullName || undefined,
          bio: state.stats.bio || undefined,
          avatarUrl: state.stats.avatarUrl || undefined,
        };
      }
    },
    closeEditModal: (state) => {
      state.isEditModalOpen = false;
      state.editData = {};
    },
    setEditData: (state, action: PayloadAction<UpdateProfileData>) => {
      state.editData = { ...state.editData, ...action.payload };
    },
    updateStatsRealtime: (state, action: PayloadAction<UserStats>) => {
      state.stats = action.payload;
    },
    clearCollections: (state) => {
      state.collectedImages = [];
      state.followedCompanies = [];
      state.hasMoreImages = true;
      state.hasMoreCompanies = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStats.pending, (state) => {
        state.fetchStats.status = 'pending';
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.fetchStats.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.fetchStats.status = 'failed';
        state.fetchStats.error = action.error.message ?? 'Failed to fetch user stats';
      });

    builder
      .addCase(fetchCollectedImages.pending, (state) => {
        state.fetchCollections.status = 'pending';
      })
      .addCase(fetchCollectedImages.fulfilled, (state, action) => {
        state.fetchCollections.status = 'succeeded';
        if (action.meta.arg.offset === 0) {
          state.collectedImages = action.payload;
        } else {
          state.collectedImages.push(...action.payload);
        }
        state.hasMoreImages = action.payload.length === (action.meta.arg.limit || 20);
      })
      .addCase(fetchCollectedImages.rejected, (state, action) => {
        state.fetchCollections.status = 'failed';
        state.fetchCollections.error = action.error.message ?? 'Failed to fetch collected images';
      });

    builder
      .addCase(fetchFollowedCompanies.pending, (state) => {
        state.fetchCollections.status = 'pending';
      })
      .addCase(fetchFollowedCompanies.fulfilled, (state, action) => {
        state.fetchCollections.status = 'succeeded';
        if (action.meta.arg.offset === 0) {
          state.followedCompanies = action.payload;
        } else {
          state.followedCompanies.push(...action.payload);
        }
        state.hasMoreCompanies = action.payload.length === (action.meta.arg.limit || 20);
      })
      .addCase(fetchFollowedCompanies.rejected, (state, action) => {
        state.fetchCollections.status = 'failed';
        state.fetchCollections.error = action.error.message ?? 'Failed to fetch followed companies';
      });
  },
});

export const {
  setActiveTab,
  openEditModal,
  closeEditModal,
  setEditData,
  updateStatsRealtime,
  clearCollections,
} = profileStatsSlice.actions;

export const profileStatsReducer = profileStatsSlice.reducer;
