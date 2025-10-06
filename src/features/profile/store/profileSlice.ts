import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
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

export const fetchUserProfile = createAsyncThunk<any, string>(
  'profile/fetchUserProfile',
  async (userId) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .or(`id.eq.${userId},auth_id.eq.${userId}`)
      .maybeSingle();
    
    if (error || !data) return null;
    
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      location: data.location,
      website: data.website,
      companyName: data.company_name,
      role: data.role,
      isActive: data.is_active ?? true,
      createdAt: new Date(data.created_at || Date.now()),
      updatedAt: new Date(data.updated_at || Date.now()),
      postCount: 0,
      followerCount: 0,
      followingCount: 0,
      bookmarkCount: 0,
    };
  }
);

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  { userId: string; data: UpdateProfileData }
>(
  'profile/updateUserProfile',
  async ({ userId, data }) => await profileRepository.updateProfile(userId, data)
);

export const uploadUserAvatar = createAsyncThunk<
  string,
  { userId: string; file: File }
>(
  'profile/uploadUserAvatar',
  async ({ userId, file }) => await profileRepository.uploadAvatar(userId, file)
);

export const fetchUserBookmarks = createAsyncThunk<BookmarkedPost[], string>(
  'profile/fetchUserBookmarks',
  async (userId) => await profileRepository.getUserBookmarks(userId)
);

export const fetchUserFollowers = createAsyncThunk<FollowerUser[], string>(
  'profile/fetchUserFollowers',
  async (userId) => await profileRepository.getFollowers(userId)
);

export const fetchUserFollowing = createAsyncThunk<FollowerUser[], string>(
  'profile/fetchUserFollowing',
  async (userId) => await profileRepository.getFollowing(userId)
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
        state.fetchProfile.error = action.error.message ?? 'Failed to fetch profile';
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
        state.updateProfile.error = action.error.message ?? 'Failed to update profile';
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
        state.uploadAvatar.error = action.error.message ?? 'Failed to upload avatar';
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
        state.fetchBookmarks.error = action.error.message ?? 'Failed to fetch bookmarks';
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
        state.fetchFollowers.error = action.error.message ?? 'Failed to fetch followers';
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
        state.fetchFollowing.error = action.error.message ?? 'Failed to fetch following';
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export const userProfileReducer = profileSlice.reducer;
