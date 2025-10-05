// Profile Slice - Redux state management for user profiles
import { createSlice } from '@reduxjs/toolkit';
import { ProfileRepository } from '../infrastructure/ProfileRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { UserProfile, UpdateProfileData, BookmarkedPost, FollowerUser } from '../domain/Profile.types';

interface ProfileState {
  currentProfile: UserProfile | null;
  bookmarks: BookmarkedPost[];
  followers: FollowerUser[];
  following: FollowerUser[];
  fetchProfile: AsyncState;
  updateProfile: AsyncState;
  uploadAvatar: AsyncState;
  fetchBookmarks: AsyncState;
  fetchFollowers: AsyncState;
  fetchFollowing: AsyncState;
}

const initialState: ProfileState = {
  currentProfile: null,
  bookmarks: [],
  followers: [],
  following: [],
  fetchProfile: initialAsyncState,
  updateProfile: initialAsyncState,
  uploadAvatar: initialAsyncState,
  fetchBookmarks: initialAsyncState,
  fetchFollowers: initialAsyncState,
  fetchFollowing: initialAsyncState,
};

const profileRepository = new ProfileRepository();

// Thunks
export const fetchUserProfile = createAsyncThunkWithError<UserProfile | null, string>(
  'profile/fetchUserProfile',
  async (userId) => {
    return await profileRepository.getProfile(userId);
  }
);

export const updateUserProfile = createAsyncThunkWithError<
  UserProfile,
  { userId: string; data: UpdateProfileData }
>(
  'profile/updateUserProfile',
  async ({ userId, data }) => {
    return await profileRepository.updateProfile(userId, data);
  }
);

export const uploadUserAvatar = createAsyncThunkWithError<
  string,
  { userId: string; file: File }
>(
  'profile/uploadUserAvatar',
  async ({ userId, file }) => {
    return await profileRepository.uploadAvatar(userId, file);
  }
);

export const fetchUserBookmarks = createAsyncThunkWithError<BookmarkedPost[], string>(
  'profile/fetchUserBookmarks',
  async (userId) => {
    return await profileRepository.getUserBookmarks(userId);
  }
);

export const fetchUserFollowers = createAsyncThunkWithError<FollowerUser[], string>(
  'profile/fetchUserFollowers',
  async (userId) => {
    return await profileRepository.getFollowers(userId);
  }
);

export const fetchUserFollowing = createAsyncThunkWithError<FollowerUser[], string>(
  'profile/fetchUserFollowing',
  async (userId) => {
    return await profileRepository.getFollowing(userId);
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.currentProfile = null;
      state.bookmarks = [];
      state.followers = [];
      state.following = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.fetchProfile.status = 'pending';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.fetchProfile.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.fetchProfile.status = 'failed';
        state.fetchProfile.error = action.payload?.message ?? 'Failed to fetch profile';
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.updateProfile.status = 'pending';
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateProfile.status = 'succeeded';
        state.currentProfile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateProfile.status = 'failed';
        state.updateProfile.error = action.payload?.message ?? 'Failed to update profile';
      });

    // Upload Avatar
    builder
      .addCase(uploadUserAvatar.pending, (state) => {
        state.uploadAvatar.status = 'pending';
      })
      .addCase(uploadUserAvatar.fulfilled, (state) => {
        state.uploadAvatar.status = 'succeeded';
      })
      .addCase(uploadUserAvatar.rejected, (state, action) => {
        state.uploadAvatar.status = 'failed';
        state.uploadAvatar.error = action.payload?.message ?? 'Failed to upload avatar';
      });

    // Fetch Bookmarks
    builder
      .addCase(fetchUserBookmarks.pending, (state) => {
        state.fetchBookmarks.status = 'pending';
      })
      .addCase(fetchUserBookmarks.fulfilled, (state, action) => {
        state.fetchBookmarks.status = 'succeeded';
        state.bookmarks = action.payload;
      })
      .addCase(fetchUserBookmarks.rejected, (state, action) => {
        state.fetchBookmarks.status = 'failed';
        state.fetchBookmarks.error = action.payload?.message ?? 'Failed to fetch bookmarks';
      });

    // Fetch Followers
    builder
      .addCase(fetchUserFollowers.pending, (state) => {
        state.fetchFollowers.status = 'pending';
      })
      .addCase(fetchUserFollowers.fulfilled, (state, action) => {
        state.fetchFollowers.status = 'succeeded';
        state.followers = action.payload;
      })
      .addCase(fetchUserFollowers.rejected, (state, action) => {
        state.fetchFollowers.status = 'failed';
        state.fetchFollowers.error = action.payload?.message ?? 'Failed to fetch followers';
      });

    // Fetch Following
    builder
      .addCase(fetchUserFollowing.pending, (state) => {
        state.fetchFollowing.status = 'pending';
      })
      .addCase(fetchUserFollowing.fulfilled, (state, action) => {
        state.fetchFollowing.status = 'succeeded';
        state.following = action.payload;
      })
      .addCase(fetchUserFollowing.rejected, (state, action) => {
        state.fetchFollowing.status = 'failed';
        state.fetchFollowing.error = action.payload?.message ?? 'Failed to fetch following';
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export const userProfileReducer = profileSlice.reducer;
