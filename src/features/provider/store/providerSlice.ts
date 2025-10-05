import { createSlice } from '@reduxjs/toolkit';
import { ProviderRepository } from '../infrastructure/ProviderRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { updateProviderWithLogo } from './providerEditThunks';
import {
  ProviderProfile,
  ProviderReview,
  UpdateProviderProfileData,
  CreateReviewData,
  CreateServiceData,
  CreatePortfolioData,
} from '../domain/Provider.types';

interface ProviderState {
  currentProfile: ProviderProfile | null;
  reviews: ProviderReview[];
  hasMoreReviews: boolean;
  isEditMode: boolean;
  fetchProfile: AsyncState;
  fetchReviews: AsyncState;
  updateProfile: AsyncState;
  uploadLogo: AsyncState;
  uploadPortfolio: AsyncState;
  createReview: AsyncState;
}

const initialState: ProviderState = {
  currentProfile: null,
  reviews: [],
  hasMoreReviews: true,
  isEditMode: false,
  fetchProfile: initialAsyncState,
  fetchReviews: initialAsyncState,
  updateProfile: initialAsyncState,
  uploadLogo: initialAsyncState,
  uploadPortfolio: initialAsyncState,
  createReview: initialAsyncState,
};

const providerRepository = new ProviderRepository();

export const fetchProviderProfile = createAsyncThunkWithError<ProviderProfile | null, string>(
  'provider/fetchProfile',
  async (providerId) => {
    return await providerRepository.getFullProfile(providerId);
  }
);

export const fetchProviderReviews = createAsyncThunkWithError<
  ProviderReview[],
  { providerId: string; limit?: number; offset?: number }
>(
  'provider/fetchReviews',
  async ({ providerId, limit = 20, offset = 0 }) => {
    return await providerRepository.getReviews(providerId, limit, offset);
  }
);

export const updateProviderProfile = createAsyncThunkWithError<
  ProviderProfile,
  { providerId: string; data: UpdateProviderProfileData }
>(
  'provider/updateProfile',
  async ({ providerId, data }) => {
    return await providerRepository.updateProfile(providerId, data);
  }
);

export const uploadProviderLogo = createAsyncThunkWithError<
  string,
  { providerId: string; file: File }
>(
  'provider/uploadLogo',
  async ({ providerId, file }) => {
    return await providerRepository.uploadLogo(providerId, file);
  }
);

export const uploadPortfolioImage = createAsyncThunkWithError<
  string,
  { providerId: string; file: File }
>(
  'provider/uploadPortfolioImage',
  async ({ providerId, file }) => {
    return await providerRepository.uploadPortfolioImage(providerId, file);
  }
);

export const addProviderService = createAsyncThunkWithError<
  boolean,
  { providerId: string; data: CreateServiceData }
>(
  'provider/addService',
  async ({ providerId, data }) => {
    return await providerRepository.addService(providerId, data);
  }
);

export const removeProviderService = createAsyncThunkWithError<boolean, string>(
  'provider/removeService',
  async (serviceId) => {
    return await providerRepository.removeService(serviceId);
  }
);

export const addProviderPortfolio = createAsyncThunkWithError<
  boolean,
  { providerId: string; imageUrl: string; data: CreatePortfolioData }
>(
  'provider/addPortfolio',
  async ({ providerId, imageUrl, data }) => {
    return await providerRepository.addPortfolio(providerId, imageUrl, data);
  }
);

export const removeProviderPortfolio = createAsyncThunkWithError<boolean, string>(
  'provider/removePortfolio',
  async (portfolioId) => {
    return await providerRepository.removePortfolio(portfolioId);
  }
);

export const createProviderReview = createAsyncThunkWithError<
  boolean,
  { reviewerId: string; data: CreateReviewData }
>(
  'provider/createReview',
  async ({ reviewerId, data }) => {
    return await providerRepository.createReview(reviewerId, data);
  }
);

const providerSlice = createSlice({
  name: 'provider',
  initialState,
  reducers: {
    clearProviderProfile: (state) => {
      state.currentProfile = null;
      state.reviews = [];
      state.hasMoreReviews = true;
    },
    setEditMode: (state, action) => {
      state.isEditMode = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProviderProfile.pending, (state) => {
        state.fetchProfile.status = 'pending';
      })
      .addCase(fetchProviderProfile.fulfilled, (state, action) => {
        state.fetchProfile.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(fetchProviderProfile.rejected, (state, action) => {
        state.fetchProfile.status = 'failed';
        state.fetchProfile.error = action.payload?.message ?? 'Failed to fetch profile';
      });

    builder
      .addCase(fetchProviderReviews.pending, (state) => {
        state.fetchReviews.status = 'pending';
      })
      .addCase(fetchProviderReviews.fulfilled, (state, action) => {
        state.fetchReviews.status = 'succeeded';
        if (action.meta.arg.offset === 0) {
          state.reviews = action.payload;
        } else {
          state.reviews.push(...action.payload);
        }
        state.hasMoreReviews = action.payload.length === (action.meta.arg.limit || 20);
      })
      .addCase(fetchProviderReviews.rejected, (state, action) => {
        state.fetchReviews.status = 'failed';
        state.fetchReviews.error = action.payload?.message ?? 'Failed to fetch reviews';
      });

    builder
      .addCase(updateProviderProfile.pending, (state) => {
        state.updateProfile.status = 'pending';
      })
      .addCase(updateProviderProfile.fulfilled, (state, action) => {
        state.updateProfile.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(updateProviderProfile.rejected, (state, action) => {
        state.updateProfile.status = 'failed';
        state.updateProfile.error = action.payload?.message ?? 'Failed to update profile';
      });

    builder
      .addCase(uploadProviderLogo.pending, (state) => {
        state.uploadLogo.status = 'pending';
      })
      .addCase(uploadProviderLogo.fulfilled, (state, action) => {
        state.uploadLogo.status = 'succeeded';
        if (state.currentProfile) {
          state.currentProfile.logoUrl = action.payload;
        }
      })
      .addCase(uploadProviderLogo.rejected, (state, action) => {
        state.uploadLogo.status = 'failed';
        state.uploadLogo.error = action.payload?.message ?? 'Failed to upload logo';
      });

    builder
      .addCase(createProviderReview.pending, (state) => {
        state.createReview.status = 'pending';
      })
      .addCase(createProviderReview.fulfilled, (state) => {
        state.createReview.status = 'succeeded';
      })
      .addCase(createProviderReview.rejected, (state, action) => {
        state.createReview.status = 'failed';
        state.createReview.error = action.payload?.message ?? 'Failed to create review';
      });

    builder
      .addCase(updateProviderWithLogo.pending, (state) => {
        state.updateProfile.status = 'pending';
      })
      .addCase(updateProviderWithLogo.fulfilled, (state, action) => {
        state.updateProfile.status = 'succeeded';
        state.currentProfile = action.payload;
        state.isEditMode = false;
      })
      .addCase(updateProviderWithLogo.rejected, (state, action) => {
        state.updateProfile.status = 'failed';
        state.updateProfile.error = action.payload?.message ?? 'Failed to update profile';
      });
  },
});

export const { clearProviderProfile, setEditMode } = providerSlice.actions;
export { updateProviderWithLogo };
export const providerReducer = providerSlice.reducer;
