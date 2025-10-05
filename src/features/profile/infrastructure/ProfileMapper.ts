// Profile Mapper - Transform Supabase models to domain models
import { UserProfile, BookmarkedPost, FollowerUser } from '../domain/Profile.types';

interface ProfileRow {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  company_name: string | null;
  role: string;
  provider_type_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  bookmark_count: number;
}

interface BookmarkRow {
  bookmark_id: string;
  post_id: string;
  title: string;
  content: string;
  created_at: string;
  author_username: string;
  author_avatar: string | null;
  like_count: number;
  comment_count: number;
}

interface FollowerRow {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export class ProfileMapper {
  static toUserProfile(row: ProfileRow): UserProfile {
    return {
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
      providerTypeId: row.provider_type_id,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      followerCount: Number(row.follower_count),
      followingCount: Number(row.following_count),
      postCount: Number(row.post_count),
      bookmarkCount: Number(row.bookmark_count),
    };
  }

  static toBookmarkedPost(row: BookmarkRow): BookmarkedPost {
    return {
      bookmarkId: row.bookmark_id,
      postId: row.post_id,
      title: row.title,
      content: row.content,
      createdAt: new Date(row.created_at),
      authorUsername: row.author_username,
      authorAvatar: row.author_avatar,
      likeCount: row.like_count,
      commentCount: row.comment_count,
    };
  }

  static toFollowerUser(row: FollowerRow): FollowerUser {
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      followerCount: 0, // Will be populated separately if needed
    };
  }
}
