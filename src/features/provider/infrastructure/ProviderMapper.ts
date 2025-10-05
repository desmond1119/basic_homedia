import {
  ProviderProfile,
  ProviderReview,
  PriceRange,
  SocialLinks,
  RatingsBreakdown,
  ProviderService,
  Portfolio,
} from '../domain/Provider.types';

interface ProviderProfileRow {
  id: string;
  username: string;
  company_name: string;
  logo_url: string | null;
  avatar_url: string | null;
  bio: string | null;
  price_range: Record<string, unknown> | null;
  social_links: Record<string, unknown> | null;
  team_size: number;
  founded_year: number | null;
  experience_years: number;
  completed_projects: number;
  overall_rating: number;
  total_reviews: number;
  ratings_breakdown: Record<string, unknown> | null;
  services: Array<Record<string, unknown>>;
  portfolios: Array<Record<string, unknown>>;
}

interface ReviewRow {
  id: string;
  provider_id: string;
  reviewer_id: string;
  reviewer_username: string;
  reviewer_avatar: string | null;
  overall_rating: number;
  ratings_breakdown: Record<string, unknown> | null;
  review_text: string | null;
  project_type: string | null;
  is_verified: boolean;
  created_at: string;
}

export class ProviderMapper {
  static toProviderProfile(row: ProviderProfileRow): ProviderProfile {
    return {
      id: row.id,
      username: row.username,
      companyName: row.company_name || '',
      logoUrl: row.logo_url,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      priceRange: this.toPriceRange(row.price_range),
      socialLinks: this.toSocialLinks(row.social_links),
      teamSize: row.team_size || 0,
      foundedYear: row.founded_year,
      experienceYears: row.experience_years || 0,
      completedProjects: row.completed_projects || 0,
      overallRating: Number(row.overall_rating) || 0,
      totalReviews: row.total_reviews || 0,
      ratingsBreakdown: this.toRatingsBreakdown(row.ratings_breakdown),
      services: this.toServices(row.services),
      portfolios: this.toPortfolios(row.portfolios),
      isApproved: (row as {is_approved?: boolean}).is_approved ?? true,
    };
  }

  static toPriceRange(data: Record<string, unknown> | null): PriceRange {
    if (!data) return { min: 0, max: 0, currency: 'HKD' };
    return {
      min: typeof data.min === 'number' ? data.min : Number(data.min) || 0,
      max: typeof data.max === 'number' ? data.max : Number(data.max) || 0,
      currency: typeof data.currency === 'string' ? data.currency : 'HKD',
    };
  }

  static toSocialLinks(data: Record<string, unknown> | null): SocialLinks {
    if (!data) return {};
    return {
      phone: typeof data.phone === 'string' ? data.phone : undefined,
      email: typeof data.email === 'string' ? data.email : undefined,
      website: typeof data.website === 'string' ? data.website : undefined,
      facebook: typeof data.facebook === 'string' ? data.facebook : undefined,
      instagram: typeof data.instagram === 'string' ? data.instagram : undefined,
      youtube: typeof data.youtube === 'string' ? data.youtube : undefined,
    };
  }

  static toRatingsBreakdown(data: Record<string, unknown> | null): RatingsBreakdown {
    if (!data) {
      return {
        quality: 0,
        communication: 0,
        timeliness: 0,
        value: 0,
      };
    }
    return {
      quality: typeof data.quality === 'number' ? data.quality : Number(data.quality) || 0,
      communication: typeof data.communication === 'number' ? data.communication : Number(data.communication) || 0,
      timeliness: typeof data.timeliness === 'number' ? data.timeliness : Number(data.timeliness) || 0,
      value: typeof data.value === 'number' ? data.value : Number(data.value) || 0,
    };
  }

  static toServices(data: Array<Record<string, unknown>>): ProviderService[] {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: typeof item.id === 'string' ? item.id : String(item.id),
      name: typeof item.name === 'string' ? item.name : '',
      key: typeof item.key === 'string' ? item.key : '',
    }));
  }

  static toPortfolios(data: Array<Record<string, unknown>>): Portfolio[] {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: typeof item.id === 'string' ? item.id : String(item.id),
      title: typeof item.title === 'string' ? item.title : '',
      imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '',
      projectType: typeof item.projectType === 'string' ? item.projectType : undefined,
      projectYear: typeof item.projectYear === 'number' ? item.projectYear : undefined,
    }));
  }

  static toProviderReview(row: ReviewRow): ProviderReview {
    return {
      id: row.id,
      providerId: row.provider_id,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_username,
      reviewerAvatar: row.reviewer_avatar,
      overallRating: row.overall_rating,
      ratingsBreakdown: this.toRatingsBreakdown(row.ratings_breakdown),
      reviewText: row.review_text,
      projectType: row.project_type,
      isVerified: row.is_verified,
      createdAt: new Date(row.created_at),
    };
  }
}
