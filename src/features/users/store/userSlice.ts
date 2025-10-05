/**
 * User Slice
 * Redux state management for users
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../domain/User.entity';
import { UserRepository } from '../infrastructure/UserRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Result } from '@/core/domain/base/Result';

interface UserState {
  users: User[];
  selectedUser: User | null;
  fetchAll: AsyncState;
  fetchById: AsyncState;
  create: AsyncState;
  update: AsyncState;
  delete: AsyncState;
}

const initialState: UserState = {
  users: [],
  selectedUser: null,
  fetchAll: initialAsyncState,
  fetchById: initialAsyncState,
  create: initialAsyncState,
  update: initialAsyncState,
  delete: initialAsyncState,
};

const userRepository = new UserRepository();

// Async Thunks
export const fetchAllUsers = createAsyncThunkWithError(
  'users/fetchAll',
  async () => {
    return await userRepository.findAll();
  }
);

export const fetchUserById = createAsyncThunkWithError(
  'users/fetchById',
  async (id: string) => {
    return await userRepository.findById(id);
  }
);

export const createUser = createAsyncThunkWithError(
  'users/create',
  async (user: User) => {
    return await userRepository.save(user);
  }
);

export const updateUser = createAsyncThunkWithError(
  'users/update',
  async ({ id, user }: { id: string; user: Partial<User> }) => {
    return await userRepository.update(id, user);
  }
);

export const deleteUser = createAsyncThunkWithError<string, string>(
  'users/delete',
  async (id: string) => {
    const result = await userRepository.delete(id);
    if (result.isSuccess()) {
      return Result.ok(id);
    }
    return Result.fail(result.getError());
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    setSelectedUser: (state, action: PayloadAction<User>) => {
      state.selectedUser = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch All Users
    builder
      .addCase(fetchAllUsers.pending, (state) => {
        state.fetchAll.status = 'pending';
        state.fetchAll.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.fetchAll.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.fetchAll.status = 'failed';
        state.fetchAll.error = action.payload?.message ?? 'Failed to fetch users';
      });

    // Fetch User By ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.fetchById.status = 'pending';
        state.fetchById.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.fetchById.status = 'succeeded';
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.fetchById.status = 'failed';
        state.fetchById.error = action.payload?.message ?? 'Failed to fetch user';
      });

    // Create User
    builder
      .addCase(createUser.pending, (state) => {
        state.create.status = 'pending';
        state.create.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.create.status = 'succeeded';
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.create.status = 'failed';
        state.create.error = action.payload?.message ?? 'Failed to create user';
      });

    // Update User
    builder
      .addCase(updateUser.pending, (state) => {
        state.update.status = 'pending';
        state.update.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.update.status = 'succeeded';
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.update.status = 'failed';
        state.update.error = action.payload?.message ?? 'Failed to update user';
      });

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.delete.status = 'pending';
        state.delete.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.delete.status = 'succeeded';
        state.users = state.users.filter((u) => u.id !== action.payload);
        if (state.selectedUser?.id === action.payload) {
          state.selectedUser = null;
        }
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.delete.status = 'failed';
        state.delete.error = action.payload?.message ?? 'Failed to delete user';
      });
  },
});

export const { clearSelectedUser, setSelectedUser } = userSlice.actions;
export const userReducer = userSlice.reducer;
