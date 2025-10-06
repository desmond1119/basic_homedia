// Profile domain types
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  companyName: string | null;
  role: string;
  providerTypeId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsernameChange: Date | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  bookmarkCount: number;
}

export interface UpdateProfileData {
  username?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  website?: string;
  companyName?: string;
  avatarUrl?: string;
}

export interface BookmarkedPost {
  bookmarkId: string;
  postId: string;
  title: string;
  content: string;
  createdAt: Date;
  authorUsername: string;
  authorAvatar: string | null;
  likeCount: number;
  commentCount: number;
}

export interface FollowerUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  isFollowing?: boolean;
}

export interface UserStats {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  collectedImagesCount: number;
  forumResponsesCount: number;
  postsCount: number;
  badges: UserBadge[];
}

export interface UserBadge {
  id: string;
  label: string;
  icon: string;
}

export interface CollectedImage {
  bookmarkId: string;
  collectedAt: Date;
  portfolioId: string;
  title: string;
  coverImageUrl: string | null;
  providerId: string;
  providerName: string | null;
  providerLogo: string | null;
}

export interface FollowedCompany {
  followId: string;
  followedAt: Date;
  companyId: string;
  username: string;
  companyName: string | null;
  logoUrl: string | null;
  bio: string | null;
  portfoliosCount: number;
  avgRating: number;
}

export type CollectionTab = 'images' | 'companies';
