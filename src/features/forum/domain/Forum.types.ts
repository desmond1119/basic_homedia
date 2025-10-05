/**
 * Forum Domain Types
 * Type definitions for forum system
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Post {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  content: string;
  tags: string[];
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  repostCount: number;
  bookmarkCount: number;
  viewCount: number;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  username?: string;
  userAvatar?: string | null;
  userFullName?: string | null;
  categoryName?: string;
  categorySlug?: string;
  // User interaction flags
  isLiked?: boolean;
  isBookmarked?: boolean;
  isReposted?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  mediaUrls: string[];
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  username?: string;
  userAvatar?: string | null;
  userFullName?: string | null;
  // User interaction flags
  isLiked?: boolean;
  // Nested comments
  replies?: Comment[];
}

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  createdAt: Date;
}

export interface Follow {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  mediaUrls: string[];
  isRead: boolean;
  createdAt: Date;
  // Joined fields
  senderUsername?: string;
  senderAvatar?: string | null;
  receiverUsername?: string;
  receiverAvatar?: string | null;
}

export interface Repost {
  id: string;
  userId: string;
  originalPostId: string;
  comment: string | null;
  createdAt: Date;
}

export interface Bookmark {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  isFollowing?: boolean;
}

// DTOs for creation
export interface CreatePostData {
  categoryId: string;
  title: string;
  content: string;
  tags?: string[];
  mediaUrls?: string[];
}

export interface CreateCommentData {
  postId: string;
  content: string;
  parentId?: string;
  mediaUrls?: string[];
}

export interface CreateMessageData {
  receiverId: string;
  content: string;
  mediaUrls?: string[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  tags?: string[];
  mediaUrls?: string[];
}

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
}
