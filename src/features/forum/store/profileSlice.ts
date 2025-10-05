/**
 * Profile Slice
 * Redux state management for user profiles
 */

import { createSlice } from '@reduxjs/toolkit';
import { ProfileRepository } from '../infrastructure/ProfileRepository';
import { ForumRepository } from '../infrastructure/ForumRepository';
import { createAsyncThunkWithError } from '@/core/store/base/createAsyncThunkWithError';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { Result } from '@/core/domain/base/Result';
import { UserProfile, Post } from '../domain/Forum.types';

interface ProfileState {
  selectedProfile: UserProfile | null;
  userPosts: Post[];
  bookmarkedPosts: Post[];
  followers: UserProfile[];
  following: UserProfile[];
  fetchProfile: AsyncState;
  fetchUserPosts: AsyncState;
  fetchBookmarks: AsyncState;
  followAction: AsyncState;
}

const initialState: ProfileState = {
  selectedProfile: null,
  userPosts: [],
  bookmarkedPosts: [],
  followers: [],
  following: [],
  fetchProfile: initialAsyncState,
  fetchUserPosts: initialAsyncState,
  fetchBookmarks: initialAsyncState,
  followAction: initialAsyncState,
};

const profileRepository = new ProfileRepository();
const forumRepository = new ForumRepository();

export const fetchUserProfile = createAsyncThunkWithError<
  UserProfile | null,
  { userId: string; currentUserId?: string }
>(
  'profile/fetchUserProfile',
  async ({ userId, currentUserId }) => {
    return await profileRepository.getUserProfile(userId, currentUserId);
  }
);

export const fetchUserPosts = createAsyncThunkWithError<
  Post[],
  { userId: string; limit?: number; offset?: number }
>(
  'profile/fetchUserPosts',
  async ({ userId, limit = 20, offset = 0 }) => {
    return await profileRepository.getUserPosts(userId, limit, offset);
  }
);

export const fetchBookmarkedPosts = createAsyncThunkWithError<Post[], string>(
  'profile/fetchBookmarkedPosts',
  async (userId) => {
    return await forumRepository.getBookmarkedPosts(userId);
  }
);

export const fetchFollowers = createAsyncThunkWithError<UserProfile[], string>(
  'profile/fetchFollowers',
  async (userId) => {
    return await profileRepository.getFollowers(userId);
  }
);

export const fetchFollowing = createAsyncThunkWithError<UserProfile[], string>(
  'profile/fetchFollowing',
  async (userId) => {
    return await profileRepository.getFollowing(userId);
  }
);

export const toggleFollow = createAsyncThunkWithError<
  { isFollowing: boolean },
  { followerId: string; followedId: string; currentlyFollowing: boolean }
>(
  'profile/toggleFollow',
  async ({ followerId, followedId, currentlyFollowing }) => {
    const actionResult = currentlyFollowing
      ? await forumRepository.unfollowUser(followerId, followedId)
      : await forumRepository.followUser(followerId, followedId);

    if (actionResult.isFailure()) {
      return Result.fail(actionResult.getError());
    }

    return Result.ok({ isFollowing: !currentlyFollowing });
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearSelectedProfile: (state) => {
      state.selectedProfile = null;
      state.userPosts = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.fetchProfile.status = 'pending';
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.fetchProfile.status = 'succeeded';
        state.selectedProfile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.fetchProfile.status = 'failed';
        state.fetchProfile.error = action.payload?.message ?? 'Failed to fetch profile';
      });

    // Fetch User Posts
    builder
      .addCase(fetchUserPosts.pending, (state) => {
        state.fetchUserPosts.status = 'pending';
      })
      .addCase(fetchUserPosts.fulfilled, (state, action) => {
        state.fetchUserPosts.status = 'succeeded';
        state.userPosts = action.payload;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.fetchUserPosts.status = 'failed';
        state.fetchUserPosts.error = action.payload?.message ?? 'Failed to fetch posts';
      });

    // Fetch Bookmarked Posts
    builder
      .addCase(fetchBookmarkedPosts.pending, (state) => {
        state.fetchBookmarks.status = 'pending';
      })
      .addCase(fetchBookmarkedPosts.fulfilled, (state, action) => {
        state.fetchBookmarks.status = 'succeeded';
        state.bookmarkedPosts = action.payload;
      })
      .addCase(fetchBookmarkedPosts.rejected, (state, action) => {
        state.fetchBookmarks.status = 'failed';
        state.fetchBookmarks.error = action.payload?.message ?? 'Failed to fetch bookmarks';
      });

    // Fetch Followers
    builder
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      });

    // Fetch Following
    builder
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.following = action.payload;
      });

    // Toggle Follow
    builder
      .addCase(toggleFollow.fulfilled, (state, action) => {
        if (state.selectedProfile) {
          state.selectedProfile.isFollowing = action.payload.isFollowing;
          state.selectedProfile.followerCount += action.payload.isFollowing ? 1 : -1;
        }
      });
  },
});

export const { clearSelectedProfile } = profileSlice.actions;
export const profileReducer = profileSlice.reducer;
