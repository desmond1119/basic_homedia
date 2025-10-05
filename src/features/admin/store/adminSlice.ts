import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AdminRepository } from '../infrastructure/AdminRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import {
  AdminStats,
  Category,
  ProviderType,
  UserApproval,
  PortfolioApproval,
  GlobalSettings,
  AnalyticsData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateProviderTypeData,
  UpdateProviderTypeData,
} from '../domain/Admin.types';

interface AdminState {
  stats: AdminStats | null;
  categories: Category[];
  providerTypes: ProviderType[];
  users: UserApproval[];
  pendingPortfolios: PortfolioApproval[];
  globalSettings: GlobalSettings | null;
  analytics: AnalyticsData | null;
  fetchStats: AsyncState;
  fetchCategories: AsyncState;
  manageCategory: AsyncState;
  fetchProviderTypes: AsyncState;
  manageProviderType: AsyncState;
  fetchUsers: AsyncState;
  manageUser: AsyncState;
  fetchPendingPortfolios: AsyncState;
  managePortfolio: AsyncState;
  fetchSettings: AsyncState;
  updateSettings: AsyncState;
  fetchAnalytics: AsyncState;
}

const initialState: AdminState = {
  stats: null,
  categories: [],
  providerTypes: [],
  users: [],
  pendingPortfolios: [],
  globalSettings: null,
  analytics: null,
  fetchStats: initialAsyncState,
  fetchCategories: initialAsyncState,
  manageCategory: initialAsyncState,
  fetchProviderTypes: initialAsyncState,
  manageProviderType: initialAsyncState,
  fetchUsers: initialAsyncState,
  manageUser: initialAsyncState,
  fetchPendingPortfolios: initialAsyncState,
  managePortfolio: initialAsyncState,
  fetchSettings: initialAsyncState,
  updateSettings: initialAsyncState,
  fetchAnalytics: initialAsyncState,
};

const adminRepository = new AdminRepository();

export const fetchAdminStats = createAsyncThunkWithError('admin/fetchStats', async () => {
  return await adminRepository.fetchAdminStats();
});

export const fetchCategories = createAsyncThunkWithError('admin/fetchCategories', async () => {
  return await adminRepository.fetchCategories();
});

export const createCategory = createAsyncThunkWithError('admin/createCategory', async (data: CreateCategoryData) => {
  return await adminRepository.createCategory(data);
});

export const updateCategory = createAsyncThunkWithError(
  'admin/updateCategory',
  async ({ id, data }: { id: string; data: UpdateCategoryData }) => {
    return await adminRepository.updateCategory(id, data);
  }
);

export const deleteCategory = createAsyncThunkWithError('admin/deleteCategory', async (id: string) => {
  return await adminRepository.deleteCategory(id);
});

export const fetchProviderTypes = createAsyncThunkWithError('admin/fetchProviderTypes', async () => {
  return await adminRepository.fetchProviderTypes();
});

export const createProviderType = createAsyncThunkWithError(
  'admin/createProviderType',
  async (data: CreateProviderTypeData) => {
    return await adminRepository.createProviderType(data);
  }
);

export const updateProviderType = createAsyncThunkWithError(
  'admin/updateProviderType',
  async ({ id, data }: { id: string; data: UpdateProviderTypeData }) => {
    return await adminRepository.updateProviderType(id, data);
  }
);

export const deleteProviderType = createAsyncThunkWithError('admin/deleteProviderType', async (id: string) => {
  return await adminRepository.deleteProviderType(id);
});

export const fetchUsers = createAsyncThunkWithError('admin/fetchUsers', async (role?: string) => {
  return await adminRepository.fetchUsers(role);
});

export const approveUser = createAsyncThunkWithError('admin/approveUser', async (userId: string) => {
  return await adminRepository.approveUser(userId);
});

export const updateUserRole = createAsyncThunkWithError(
  'admin/updateUserRole',
  async ({ userId, role }: { userId: string; role: string }) => {
    return await adminRepository.updateUserRole(userId, role);
  }
);

export const fetchPendingPortfolios = createAsyncThunkWithError('admin/fetchPendingPortfolios', async () => {
  return await adminRepository.fetchPendingPortfolios();
});

export const approvePortfolio = createAsyncThunkWithError('admin/approvePortfolio', async (portfolioId: string) => {
  return await adminRepository.approvePortfolio(portfolioId);
});

export const rejectPortfolio = createAsyncThunkWithError('admin/rejectPortfolio', async (portfolioId: string) => {
  return await adminRepository.rejectPortfolio(portfolioId);
});

export const fetchGlobalSettings = createAsyncThunkWithError('admin/fetchGlobalSettings', async () => {
  return await adminRepository.fetchGlobalSettings();
});

export const updateGlobalSettings = createAsyncThunkWithError(
  'admin/updateGlobalSettings',
  async (settings: Partial<GlobalSettings>) => {
    return await adminRepository.updateGlobalSettings(settings);
  }
);

export const fetchAnalytics = createAsyncThunkWithError('admin/fetchAnalytics', async () => {
  return await adminRepository.fetchAnalytics();
});

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCategoriesRealtime: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setProviderTypesRealtime: (state, action: PayloadAction<ProviderType[]>) => {
      state.providerTypes = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.fetchStats.status = 'pending';
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.fetchStats.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.fetchStats.status = 'failed';
        state.fetchStats.error = action.payload?.message ?? 'Failed to fetch stats';
      })
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
      })
      .addCase(createCategory.pending, (state) => {
        state.manageCategory.status = 'pending';
      })
      .addCase(createCategory.fulfilled, (state) => {
        state.manageCategory.status = 'succeeded';
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.manageCategory.status = 'failed';
        state.manageCategory.error = action.payload?.message ?? 'Failed to create category';
      })
      .addCase(updateCategory.pending, (state) => {
        state.manageCategory.status = 'pending';
      })
      .addCase(updateCategory.fulfilled, (state) => {
        state.manageCategory.status = 'succeeded';
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.manageCategory.status = 'failed';
        state.manageCategory.error = action.payload?.message ?? 'Failed to update category';
      })
      .addCase(deleteCategory.pending, (state) => {
        state.manageCategory.status = 'pending';
      })
      .addCase(deleteCategory.fulfilled, (state) => {
        state.manageCategory.status = 'succeeded';
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.manageCategory.status = 'failed';
        state.manageCategory.error = action.payload?.message ?? 'Failed to delete category';
      })
      .addCase(fetchProviderTypes.pending, (state) => {
        state.fetchProviderTypes.status = 'pending';
      })
      .addCase(fetchProviderTypes.fulfilled, (state, action) => {
        state.fetchProviderTypes.status = 'succeeded';
        state.providerTypes = action.payload;
      })
      .addCase(fetchProviderTypes.rejected, (state, action) => {
        state.fetchProviderTypes.status = 'failed';
        state.fetchProviderTypes.error = action.payload?.message ?? 'Failed to fetch provider types';
      })
      .addCase(createProviderType.pending, (state) => {
        state.manageProviderType.status = 'pending';
      })
      .addCase(createProviderType.fulfilled, (state) => {
        state.manageProviderType.status = 'succeeded';
      })
      .addCase(createProviderType.rejected, (state, action) => {
        state.manageProviderType.status = 'failed';
        state.manageProviderType.error = action.payload?.message ?? 'Failed to create provider type';
      })
      .addCase(updateProviderType.pending, (state) => {
        state.manageProviderType.status = 'pending';
      })
      .addCase(updateProviderType.fulfilled, (state) => {
        state.manageProviderType.status = 'succeeded';
      })
      .addCase(updateProviderType.rejected, (state, action) => {
        state.manageProviderType.status = 'failed';
        state.manageProviderType.error = action.payload?.message ?? 'Failed to update provider type';
      })
      .addCase(deleteProviderType.pending, (state) => {
        state.manageProviderType.status = 'pending';
      })
      .addCase(deleteProviderType.fulfilled, (state) => {
        state.manageProviderType.status = 'succeeded';
      })
      .addCase(deleteProviderType.rejected, (state, action) => {
        state.manageProviderType.status = 'failed';
        state.manageProviderType.error = action.payload?.message ?? 'Failed to delete provider type';
      })
      .addCase(fetchUsers.pending, (state) => {
        state.fetchUsers.status = 'pending';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.fetchUsers.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.fetchUsers.status = 'failed';
        state.fetchUsers.error = action.payload?.message ?? 'Failed to fetch users';
      })
      .addCase(approveUser.pending, (state) => {
        state.manageUser.status = 'pending';
      })
      .addCase(approveUser.fulfilled, (state) => {
        state.manageUser.status = 'succeeded';
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.manageUser.status = 'failed';
        state.manageUser.error = action.payload?.message ?? 'Failed to approve user';
      })
      .addCase(updateUserRole.pending, (state) => {
        state.manageUser.status = 'pending';
      })
      .addCase(updateUserRole.fulfilled, (state) => {
        state.manageUser.status = 'succeeded';
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.manageUser.status = 'failed';
        state.manageUser.error = action.payload?.message ?? 'Failed to update user role';
      })
      .addCase(fetchPendingPortfolios.pending, (state) => {
        state.fetchPendingPortfolios.status = 'pending';
      })
      .addCase(fetchPendingPortfolios.fulfilled, (state, action) => {
        state.fetchPendingPortfolios.status = 'succeeded';
        state.pendingPortfolios = action.payload;
      })
      .addCase(fetchPendingPortfolios.rejected, (state, action) => {
        state.fetchPendingPortfolios.status = 'failed';
        state.fetchPendingPortfolios.error = action.payload?.message ?? 'Failed to fetch pending portfolios';
      })
      .addCase(approvePortfolio.pending, (state) => {
        state.managePortfolio.status = 'pending';
      })
      .addCase(approvePortfolio.fulfilled, (state) => {
        state.managePortfolio.status = 'succeeded';
      })
      .addCase(approvePortfolio.rejected, (state, action) => {
        state.managePortfolio.status = 'failed';
        state.managePortfolio.error = action.payload?.message ?? 'Failed to approve portfolio';
      })
      .addCase(rejectPortfolio.pending, (state) => {
        state.managePortfolio.status = 'pending';
      })
      .addCase(rejectPortfolio.fulfilled, (state) => {
        state.managePortfolio.status = 'succeeded';
      })
      .addCase(rejectPortfolio.rejected, (state, action) => {
        state.managePortfolio.status = 'failed';
        state.managePortfolio.error = action.payload?.message ?? 'Failed to reject portfolio';
      })
      .addCase(fetchGlobalSettings.pending, (state) => {
        state.fetchSettings.status = 'pending';
      })
      .addCase(fetchGlobalSettings.fulfilled, (state, action) => {
        state.fetchSettings.status = 'succeeded';
        state.globalSettings = action.payload;
      })
      .addCase(fetchGlobalSettings.rejected, (state, action) => {
        state.fetchSettings.status = 'failed';
        state.fetchSettings.error = action.payload?.message ?? 'Failed to fetch settings';
      })
      .addCase(updateGlobalSettings.pending, (state) => {
        state.updateSettings.status = 'pending';
      })
      .addCase(updateGlobalSettings.fulfilled, (state) => {
        state.updateSettings.status = 'succeeded';
      })
      .addCase(updateGlobalSettings.rejected, (state, action) => {
        state.updateSettings.status = 'failed';
        state.updateSettings.error = action.payload?.message ?? 'Failed to update settings';
      })
      .addCase(fetchAnalytics.pending, (state) => {
        state.fetchAnalytics.status = 'pending';
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.fetchAnalytics.status = 'succeeded';
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.fetchAnalytics.status = 'failed';
        state.fetchAnalytics.error = action.payload?.message ?? 'Failed to fetch analytics';
      });
  },
});

export const { setCategoriesRealtime, setProviderTypesRealtime } = adminSlice.actions;
export const adminReducer = adminSlice.reducer;
