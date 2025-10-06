// Database row types matching actual Supabase schema
import { Database } from '@/types/database.types';

// Extract exact row types from generated database types
export type AppUserRow = Database['public']['Tables']['app_users']['Row'];
export type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
export type FollowRow = Database['public']['Tables']['follows']['Row'];

// Stats from RPC function - matches actual database return
export interface UserStatsRow {
  posts_count: number;
  followers_count: number;
  following_count: number;
  bookmarks_count: number;
}

// Alternative if RPC returns different names
export interface UserStatsRowAlt {
  post_count: number;
  follower_count: number;
  following_count: number;
  bookmark_count?: number;
}

// Type guard to handle both formats
export const normalizeStats = (stats: UserStatsRow | UserStatsRowAlt | null | undefined): UserStatsRow => {
  if (!stats) {
    return {
      posts_count: 0,
      followers_count: 0,
      following_count: 0,
      bookmarks_count: 0,
    };
  }

  // Check if it's the alt format
  if ('post_count' in stats) {
    return {
      posts_count: stats.post_count,
      followers_count: stats.follower_count,
      following_count: stats.following_count,
      bookmarks_count: stats.bookmark_count ?? 0,
    };
  }

  return stats as UserStatsRow;
};

// Mapper functions to convert DB rows to domain models
export const mapAppUserToProfile = (
  row: AppUserRow,
  stats?: UserStatsRow
) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  fullName: row.full_name,
  avatarUrl: row.avatar_url,
  bio: row.bio,
  location: row.location,
  website: row.website,
  companyName: row.company_name,
  role: row.role,
  providerTypeId: null,
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at || Date.now()),
  updatedAt: new Date(row.updated_at || Date.now()),
  lastUsernameChange: (row as any).last_username_change ? new Date((row as any).last_username_change) : null,
  postCount: stats?.posts_count ?? 0,
  followerCount: stats?.followers_count ?? 0,
  followingCount: stats?.following_count ?? 0,
  bookmarkCount: stats?.bookmarks_count ?? 0,
});

// Type-safe update data matching database columns
export interface UpdateAppUserData {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  website?: string;
  company_name?: string;
  avatar_url?: string;
}

export const mapUpdateDataToDbColumns = (data: {
  username?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  website?: string;
  companyName?: string;
  avatarUrl?: string;
}): UpdateAppUserData => {
  const dbData: UpdateAppUserData = {};
  
  if (data.username !== undefined) dbData.username = data.username;
  if (data.fullName !== undefined) dbData.full_name = data.fullName;
  if (data.bio !== undefined) dbData.bio = data.bio;
  if (data.location !== undefined) dbData.location = data.location;
  if (data.website !== undefined) dbData.website = data.website;
  if (data.companyName !== undefined) dbData.company_name = data.companyName;
  if (data.avatarUrl !== undefined) dbData.avatar_url = data.avatarUrl;
  
  return dbData;
};
