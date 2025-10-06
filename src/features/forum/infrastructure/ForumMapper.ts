/**
 * Forum Mapper
 * Maps between Supabase models and domain models
 */

import {
  Category,
  Post,
  Comment,
  Like,
  Follow,
  Message,
  Repost,
  Bookmark,
} from '../domain/Forum.types';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface PostRow {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  content: string;
  tags: string[];
  media_urls: string[];
  like_count: number;
  comment_count: number;
  repost_count: number;
  bookmark_count: number;
  view_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  user_avatar?: string | null;
  user_full_name?: string | null;
  category_name?: string;
  category_slug?: string;
}

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  media_urls: string[];
  like_count: number;
  created_at: string;
  updated_at: string;
  username?: string;
  user_avatar?: string | null;
  user_full_name?: string | null;
}

interface LikeRow {
  id: string;
  user_id: string;
  target_id: string;
  target_type: 'post' | 'comment';
  created_at: string;
}

interface FollowRow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  media_urls: string[];
  is_read: boolean;
  created_at: string;
}

interface RepostRow {
  id: string;
  user_id: string;
  original_post_id: string;
  comment: string | null;
  created_at: string;
}

interface BookmarkRow {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export class ForumMapper {
  static toCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      icon: row.icon,
      displayOrder: row.display_order,
      isActive: row.is_active,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }

  static toPost(row: PostRow): Post {
    return {
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      title: row.title,
      content: row.content,
      tags: row.tags || [],
      mediaUrls: row.media_urls || [],
      likeCount: row.like_count,
      commentCount: row.comment_count,
      repostCount: row.repost_count,
      bookmarkCount: row.bookmark_count,
      viewCount: row.view_count,
      isPinned: row.is_pinned,
      createdAt: row.created_at, // Keep as string for Redux serialization
      updatedAt: row.updated_at, // Keep as string for Redux serialization
      username: row.username,
      userAvatar: row.user_avatar,
      userFullName: row.user_full_name,
      categoryName: row.category_name,
      categorySlug: row.category_slug,
    };
  }

  static toComment(row: CommentRow): Comment {
    return {
      id: row.id,
      postId: row.post_id,
      userId: row.user_id,
      parentId: row.parent_id,
      content: row.content,
      mediaUrls: row.media_urls || [],
      likeCount: row.like_count,
      createdAt: row.created_at, // Keep as string for Redux serialization
      updatedAt: row.updated_at, // Keep as string for Redux serialization
      username: row.username,
      userAvatar: row.user_avatar,
      userFullName: row.user_full_name,
      replies: [],
    };
  }

  static toLike(row: LikeRow): Like {
    return {
      id: row.id,
      userId: row.user_id,
      targetId: row.target_id,
      targetType: row.target_type,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }

  static toFollow(row: FollowRow): Follow {
    return {
      id: row.id,
      followerId: row.follower_id,
      followedId: row.followed_id,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }

  static toMessage(row: MessageRow): Message {
    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      content: row.content,
      mediaUrls: row.media_urls || [],
      isRead: row.is_read,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }

  static toRepost(row: RepostRow): Repost {
    return {
      id: row.id,
      userId: row.user_id,
      originalPostId: row.original_post_id,
      comment: row.comment,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }

  static toBookmark(row: BookmarkRow): Bookmark {
    return {
      id: row.id,
      userId: row.user_id,
      postId: row.post_id,
      createdAt: row.created_at, // Keep as string for Redux serialization
    };
  }
}
