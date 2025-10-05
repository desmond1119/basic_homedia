import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PortfolioRepository } from '../infrastructure/PortfolioRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Result } from '@/core/domain/base/Result';
import {
  Portfolio,
  PortfolioCategory,
  CreatePortfolioData,
  UpdatePortfolioData,
  AddPortfolioImageData,
  PortfolioFilters,
  PortfolioSort,
  PortfolioAnalytics,
} from '../domain/Portfolio.types';

interface PortfolioState {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  categories: PortfolioCategory[];
  analytics: PortfolioAnalytics | null;
  uploadProgress: number;
  hasMore: boolean;
  filters: PortfolioFilters;
  sort: PortfolioSort;
  fetchPortfolios: AsyncState;
  fetchPortfolio: AsyncState;
  createPortfolio: AsyncState;
  updatePortfolio: AsyncState;
  uploadImage: AsyncState;
  fetchCategories: AsyncState;
  fetchAnalytics: AsyncState;
}

const initialState: PortfolioState = {
  portfolios: [],
  currentPortfolio: null,
  categories: [],
  analytics: null,
  uploadProgress: 0,
  hasMore: true,
  filters: {},
  sort: { field: 'created_at', order: 'desc' },
  fetchPortfolios: initialAsyncState,
  fetchPortfolio: initialAsyncState,
  createPortfolio: initialAsyncState,
  updatePortfolio: initialAsyncState,
  uploadImage: initialAsyncState,
  fetchCategories: initialAsyncState,
  fetchAnalytics: initialAsyncState,
};

const portfolioRepository = new PortfolioRepository();

export const fetchPortfolios = createAsyncThunkWithError<
  Portfolio[],
  { filters?: PortfolioFilters; sort?: PortfolioSort; limit?: number; offset?: number }
>(
  'portfolio/fetchPortfolios',
  async ({ filters = {}, sort = { field: 'created_at', order: 'desc' }, limit = 20, offset = 0 }) => {
    return await portfolioRepository.getPortfolios(filters, sort, limit, offset);
  }
);

export const fetchPortfolio = createAsyncThunkWithError<Portfolio | null, string>(
  'portfolio/fetchPortfolio',
  async (portfolioId) => {
    return await portfolioRepository.getPortfolio(portfolioId);
  }
);

export const createPortfolio = createAsyncThunkWithError<
  Portfolio,
  { userId: string; data: CreatePortfolioData }
>(
  'portfolio/createPortfolio',
  async ({ userId, data }) => {
    return await portfolioRepository.createPortfolio(userId, data);
  }
);

export const updatePortfolioData = createAsyncThunkWithError<
  Portfolio,
  { portfolioId: string; data: UpdatePortfolioData }
>(
  'portfolio/updatePortfolio',
  async ({ portfolioId, data }) => {
    return await portfolioRepository.updatePortfolio(portfolioId, data);
  }
);

export const uploadPortfolioFile = createAsyncThunkWithError<
  string,
  { file: File; userId: string }
>(
  'portfolio/uploadFile',
  async ({ file, userId }) => {
    return await portfolioRepository.uploadFile(file, userId);
  }
);

export const addPortfolioImage = createAsyncThunkWithError<boolean, AddPortfolioImageData>(
  'portfolio/addImage',
  async (data) => {
    const result = await portfolioRepository.addImage(data);
    return Result.ok(true);
  }
);

export const fetchCategories = createAsyncThunkWithError<PortfolioCategory[], void>(
  'portfolio/fetchCategories',
  async () => {
    return await portfolioRepository.getCategories();
  }
);

export const collectPortfolio = createAsyncThunkWithError<
  boolean,
  { userId: string; portfolioId: string }
>(
  'portfolio/collect',
  async ({ userId, portfolioId }) => {
    return await portfolioRepository.collectPortfolio(userId, portfolioId);
  }
);

export const uncollectPortfolio = createAsyncThunkWithError<
  boolean,
  { userId: string; portfolioId: string }
>(
  'portfolio/uncollect',
  async ({ userId, portfolioId }) => {
    return await portfolioRepository.uncollectPortfolio(userId, portfolioId);
  }
);

export const fetchPortfolioAnalytics = createAsyncThunkWithError<
  PortfolioAnalytics,
  { portfolioId: string; days?: number }
>(
  'portfolio/fetchAnalytics',
  async ({ portfolioId, days = 30 }) => {
    return await portfolioRepository.getAnalytics(portfolioId, days);
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearPortfolios: (state) => {
      state.portfolios = [];
      state.hasMore = true;
    },
    setFilters: (state, action: PayloadAction<PortfolioFilters>) => {
      state.filters = action.payload;
      state.portfolios = [];
      state.hasMore = true;
    },
    setSort: (state, action: PayloadAction<PortfolioSort>) => {
      state.sort = action.payload;
      state.portfolios = [];
      state.hasMore = true;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolios.pending, (state) => {
        state.fetchPortfolios.status = 'pending';
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.fetchPortfolios.status = 'succeeded';
        if (action.meta.arg.offset === 0) {
          state.portfolios = action.payload;
        } else {
          state.portfolios.push(...action.payload);
        }
        state.hasMore = action.payload.length === (action.meta.arg.limit || 20);
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.fetchPortfolios.status = 'failed';
        state.fetchPortfolios.error = action.payload?.message ?? 'Failed to fetch portfolios';
      });

    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.fetchPortfolio.status = 'pending';
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.fetchPortfolio.status = 'succeeded';
        state.currentPortfolio = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.fetchPortfolio.status = 'failed';
        state.fetchPortfolio.error = action.payload?.message ?? 'Failed to fetch portfolio';
      });

    builder
      .addCase(createPortfolio.pending, (state) => {
        state.createPortfolio.status = 'pending';
      })
      .addCase(createPortfolio.fulfilled, (state, action) => {
        state.createPortfolio.status = 'succeeded';
        state.currentPortfolio = action.payload;
      })
      .addCase(createPortfolio.rejected, (state, action) => {
        state.createPortfolio.status = 'failed';
        state.createPortfolio.error = action.payload?.message ?? 'Failed to create portfolio';
      });

    builder
      .addCase(updatePortfolioData.pending, (state) => {
        state.updatePortfolio.status = 'pending';
      })
      .addCase(updatePortfolioData.fulfilled, (state, action) => {
        state.updatePortfolio.status = 'succeeded';
        state.currentPortfolio = action.payload;
      })
      .addCase(updatePortfolioData.rejected, (state, action) => {
        state.updatePortfolio.status = 'failed';
        state.updatePortfolio.error = action.payload?.message ?? 'Failed to update portfolio';
      });

    builder
      .addCase(uploadPortfolioFile.pending, (state) => {
        state.uploadImage.status = 'pending';
      })
      .addCase(uploadPortfolioFile.fulfilled, (state) => {
        state.uploadImage.status = 'succeeded';
        state.uploadProgress = 0;
      })
      .addCase(uploadPortfolioFile.rejected, (state, action) => {
        state.uploadImage.status = 'failed';
        state.uploadImage.error = action.payload?.message ?? 'Failed to upload file';
        state.uploadProgress = 0;
      });

    builder
      .addCase(fetchCategories.pending, (state) => {
        state.fetchCategories.status = 'pending';
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.fetchCategories.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.fetchCategories.status = 'failed';
        state.fetchCategories.error = action.payload?.message ?? 'Failed to fetch categories';
      });

    builder
      .addCase(fetchPortfolioAnalytics.pending, (state) => {
        state.fetchAnalytics.status = 'pending';
      })
      .addCase(fetchPortfolioAnalytics.fulfilled, (state, action) => {
        state.fetchAnalytics.status = 'succeeded';
        state.analytics = action.payload;
      })
      .addCase(fetchPortfolioAnalytics.rejected, (state, action) => {
        state.fetchAnalytics.status = 'failed';
        state.fetchAnalytics.error = action.payload?.message ?? 'Failed to fetch analytics';
      });
  },
});

export const { clearPortfolios, setFilters, setSort, setUploadProgress } = portfolioSlice.actions;
export const portfolioReducer = portfolioSlice.reducer;
