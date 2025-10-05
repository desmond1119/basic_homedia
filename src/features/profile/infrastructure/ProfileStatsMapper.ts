import { UserStats, UserBadge, CollectedImage, FollowedCompany } from '../domain/Profile.types';

interface UserStatsRow {
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  following_count: number;
  collected_images_count: number;
  forum_responses_count: number;
  posts_count: number;
}

interface CollectedImageRow {
  bookmark_id: string;
  collected_at: string;
  portfolio_id: string;
  title: string;
  cover_image_url: string | null;
  provider_id: string;
  provider_name: string | null;
  provider_logo: string | null;
}

interface FollowedCompanyRow {
  follow_id: string;
  followed_at: string;
  company_id: string;
  username: string;
  company_name: string | null;
  logo_url: string | null;
  bio: string | null;
  portfolios_count: number;
  avg_rating: number;
}

export class ProfileStatsMapper {
  static toUserStats(row: UserStatsRow, badgesJson?: unknown): UserStats {
    const badges = this.parseBadges(badgesJson);

    return {
      userId: row.user_id,
      username: row.username,
      fullName: row.full_name,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      collectedImagesCount: row.collected_images_count || 0,
      forumResponsesCount: row.forum_responses_count || 0,
      postsCount: row.posts_count || 0,
      badges,
    };
  }

  static parseBadges(badgesJson: unknown): UserBadge[] {
    if (!badgesJson) return [];
    if (typeof badgesJson === 'string') {
      try {
        const parsed = JSON.parse(badgesJson);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (Array.isArray(badgesJson)) {
      return badgesJson.map((b) => ({
        id: String(b.id || ''),
        label: String(b.label || ''),
        icon: String(b.icon || ''),
      }));
    }
    return [];
  }

  static toCollectedImage(row: CollectedImageRow): CollectedImage {
    return {
      bookmarkId: row.bookmark_id,
      collectedAt: new Date(row.collected_at),
      portfolioId: row.portfolio_id,
      title: row.title,
      coverImageUrl: row.cover_image_url,
      providerId: row.provider_id,
      providerName: row.provider_name,
      providerLogo: row.provider_logo,
    };
  }

  static toFollowedCompany(row: FollowedCompanyRow): FollowedCompany {
    return {
      followId: row.follow_id,
      followedAt: new Date(row.followed_at),
      companyId: row.company_id,
      username: row.username,
      companyName: row.company_name,
      logoUrl: row.logo_url,
      bio: row.bio,
      portfoliosCount: row.portfolios_count || 0,
      avgRating: row.avg_rating || 0,
    };
  }
}
