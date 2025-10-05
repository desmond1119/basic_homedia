export type InspirationCategory = 'sleeproom' | 'kitchen' | 'living' | 'bathroom' | 'outdoor' | 'office';

export interface InspirationProviderInfo {
  readonly id: string;
  readonly companyName: string;
  readonly username?: string | null;
  readonly logoUrl?: string | null;
  readonly avatarUrl?: string | null;
  readonly rating: number;
  readonly reviewCount: number;
  readonly isSponsored: boolean;
  readonly isVerified: boolean;
  readonly isFollowing: boolean;
}

export interface InspirationStats {
  readonly collects: number;
  readonly likes: number;
}

export interface InspirationItem {
  readonly id: string;
  readonly providerId: string;
  readonly title: string;
  readonly description?: string | null;
  readonly heroImage: string;
  readonly gallery: string[];
  readonly projectType?: string | null;
  readonly location?: string | null;
  readonly priceMin?: number | null;
  readonly priceMax?: number | null;
  readonly currency: string;
  readonly tags: string[];
  readonly pinned: boolean;
  readonly featured: boolean;
  readonly createdAt?: string | null;
  readonly stats: InspirationStats;
  readonly provider: InspirationProviderInfo;
  readonly isCollected: boolean;
  readonly isLiked: boolean;
  readonly personalizationScore?: number;
}

export interface InspirationFilterState {
  readonly type?: string;
  readonly location?: string;
  readonly priceMin?: number;
  readonly priceMax?: number;
  readonly ratingMin?: number;
  readonly tag?: string;
}

export type InspirationSortOption = 'newest' | 'popular' | 'personalized';

export interface InspirationPage {
  readonly items: InspirationItem[];
  readonly hasMore: boolean;
  readonly nextPage: number | null;
  readonly total?: number;
}
