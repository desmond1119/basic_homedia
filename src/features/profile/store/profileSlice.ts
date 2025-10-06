import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
import { AsyncState, initialAsyncState } from '@/core/store/base/LoadingState';
import { UserProfile, UpdateProfileData, BookmarkedPost, FollowerUser } from '../domain/Profile.types';
import { 
  AppUserRow, 
  UserStatsRowAlt,
  normalizeStats,
  mapAppUserToProfile, 
  mapUpdateDataToDbColumns 
} from '../infrastructure/types';
import { setAuthUser } from '@/features/auth/store/authSlice';

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
  // Note: realtimeChannel removed - should be managed outside Redux to avoid serialization issues
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

export const fetchUserProfile = createAsyncThunk<UserProfile | null, string>(
  'profile/fetchUserProfile',
  async (userId) => {
    const { data: userData, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .or(`id.eq.${userId},auth_id.eq.${userId}`)
      .maybeSingle();
    
    if (userError || !userData) {
      console.error('Failed to fetch user:', userError);
      return null;
    }

    // Fetch stats separately
    const { data: statsData } = await supabase
      .rpc('get_user_stats', { user_uuid: userData.id })
      .maybeSingle();

    // Normalize stats to handle different formats
    const normalizedStats = normalizeStats(statsData as UserStatsRowAlt | null);

    // Use type-safe mapper
    return mapAppUserToProfile(
      userData as AppUserRow,
      normalizedStats
    );
  }
);

export const updateUserProfile = createAsyncThunk<UserProfile | null, { userId: string; data: UpdateProfileData; avatarFile?: File }>(
  'profile/updateUserProfile',
  async ({ userId, data, avatarFile }, { dispatch, rejectWithValue }) => {
    try {
      let dbData = mapUpdateDataToDbColumns(data);
      
      // Handle avatar upload if file provided
      if (avatarFile) {
        const maxSize = 5 * 1024 * 1024;
        if (avatarFile.size > maxSize) {
          throw new Error('AVATAR_TOO_LARGE');
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(avatarFile.type)) {
          throw new Error('INVALID_FILE_TYPE');
        }

        const fileName = `${userId}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
        
        console.log('Uploading avatar:', fileName, 'Size:', avatarFile.size);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { 
            upsert: true,
            contentType: avatarFile.type,
          });
        
        if (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          throw new Error(`AVATAR_UPLOAD_FAILED:${uploadError.message}`);
        }
        
        console.log('Avatar uploaded:', uploadData);
        
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        dbData = { ...dbData, avatar_url: urlData.publicUrl };
        
        console.log('Avatar URL:', urlData.publicUrl);
      }
      
      const { error } = await supabase.from('app_users').update(dbData).eq('id', userId);
      
      if (error) {
        console.error('Failed to update profile:', error);
        throw new Error(error.message);
      }
      
      const result = await dispatch(fetchUserProfile(userId));
      const updatedProfile = result.payload as UserProfile | null;
      
      // Update auth slice with new avatar/name
      if (updatedProfile) {
        dispatch(setAuthUser({
          id: updatedProfile.id,
          email: updatedProfile.email,
          username: updatedProfile.username,
          role: updatedProfile.role,
          avatarUrl: updatedProfile.avatarUrl || undefined,
        }));
      }
      
      return updatedProfile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      console.error('Update profile error:', message);
      return rejectWithValue(message);
    }
  }
);

export const uploadUserAvatar = createAsyncThunk<string, { userId: string; file: File }>(
  'profile/uploadUserAvatar',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('AVATAR_TOO_LARGE');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('INVALID_FILE_TYPE');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      console.log('Uploading avatar:', fileName, 'Size:', file.size, 'Type:', file.type);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Avatar upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Avatar uploaded successfully:', uploadData);

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Avatar public URL:', urlData.publicUrl);

      return urlData.publicUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      console.error('Upload avatar exception:', message, error);
      return rejectWithValue(message);
    }
  }
);

export const fetchUserBookmarks = createAsyncThunk<BookmarkedPost[], string>(
  'profile/fetchUserBookmarks',
  async (userId) => {
    const { data, error } = await supabase.from('bookmarks').select('*').eq('user_id', userId);
    
    if (error || !data) {
      console.error('Failed to fetch bookmarks:', error);
      return [];
    }
    
    // Return empty array for now - proper mapping requires join with posts table
    return [];
  }
);

export const fetchUserFollowers = createAsyncThunk<FollowerUser[], string>(
  'profile/fetchUserFollowers',
  async (userId) => {
    const { data, error } = await supabase.from('follows').select('*').eq('following_id', userId);
    
    if (error || !data) {
      console.error('Failed to fetch followers:', error);
      return [];
    }
    
    // Return empty array for now - proper mapping requires join with app_users table
    return [];
  }
);

export const fetchUserFollowing = createAsyncThunk<FollowerUser[], string>(
  'profile/fetchUserFollowing',
  async (userId) => {
    const { data, error } = await supabase.from('follows').select('*').eq('follower_id', userId);
    
    if (error || !data) {
      console.error('Failed to fetch following:', error);
      return [];
    }
    
    // Return empty array for now - proper mapping requires join with app_users table
    return [];
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
    setProfile: (state, action) => {
      state.currentProfile = action.payload;
    },
    updateProfileRealtime: (state, action) => {
      if (state.currentProfile && action.payload.id === state.currentProfile.id) {
        state.currentProfile = { ...state.currentProfile, ...action.payload };
      }
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
      .addCase(uploadUserAvatar.fulfilled, (state, action) => {
        state.uploadAvatar.status = 'succeeded';
        // Update current profile with new avatar URL
        if (state.currentProfile) {
          state.currentProfile = { ...state.currentProfile, avatarUrl: action.payload };
        }
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

export const { clearProfile, setProfile, updateProfileRealtime } = profileSlice.actions;
export const userProfileReducer = profileSlice.reducer;

// Realtime subscription helper
export const subscribeToProfileUpdates = (userId: string) => (dispatch: any) => {
  const channel = supabase
    .channel(`profile:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'app_users',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const updated = payload.new as AppUserRow;
        dispatch(updateProfileRealtime({
          id: updated.id,
          username: updated.username,
          fullName: updated.full_name,
          avatarUrl: updated.avatar_url,
          bio: updated.bio,
        }));
        
        // Update auth slice
        dispatch(setAuthUser({
          id: updated.id,
          email: updated.email,
          username: updated.username,
          role: updated.role,
          avatarUrl: updated.avatar_url || undefined,
        }));
      }
    )
    .subscribe();
  
  // Return channel for external management (not stored in Redux)
  return channel;
};
