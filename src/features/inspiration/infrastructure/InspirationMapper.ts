import type { InspirationFeedRow } from '@/services/inspiration';
import { InspirationItem } from '../domain/Inspiration.types';

interface MapperOptions {
  readonly isCollected: boolean;
  readonly isLiked: boolean;
  readonly isFollowing: boolean;
  readonly personalizationScore?: number;
}

const parseGallery = (value: unknown, fallback: string): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry : null))
      .filter((entry): entry is string => Boolean(entry));
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === 'string' ? entry : null))
          .filter((entry): entry is string => Boolean(entry));
      }
    } catch (error) {
      console.warn('Failed to parse gallery images', error);
    }
  }

  return [fallback];
};

const parseTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry : null))
      .filter((entry): entry is string => Boolean(entry));
  }

  return [];
};

export const InspirationMapper = {
  toDomain(row: InspirationFeedRow, options: MapperOptions): InspirationItem {
    const gallery = parseGallery(row.gallery_images, row.image_url);
    const tags = parseTags(row.tags);

    return {
      id: row.id,
      providerId: row.provider_id,
      title: row.title,
      description: row.description,
      heroImage: row.image_url,
      gallery,
      projectType: row.project_type,
      location: row.location,
      priceMin: row.price_min,
      priceMax: row.price_max,
      currency: row.currency_code ?? 'USD',
      tags,
      pinned: Boolean(row.pinned),
      featured: Boolean(row.is_featured),
      createdAt: row.created_at,
      stats: {
        collects: Number(row.collect_count ?? 0),
        likes: Number(row.like_count ?? 0),
      },
      provider: {
        id: row.provider_id,
        companyName: row.company_name ?? '',
        username: row.username,
        logoUrl: row.logo_url,
        avatarUrl: row.avatar_url,
        rating: Number(row.overall_rating ?? 0),
        reviewCount: Number(row.total_reviews ?? 0),
        isSponsored: Boolean(row.is_sponsored),
        isVerified: Boolean(row.is_verified),
        isFollowing: options.isFollowing,
      },
      isCollected: options.isCollected,
      isLiked: options.isLiked,
      personalizationScore: options.personalizationScore,
    };
  },
} as const;
