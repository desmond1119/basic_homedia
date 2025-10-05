export interface ProviderProfile {
  id: string;
  username: string;
  companyName: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  bio: string | null;
  priceRange: PriceRange;
  socialLinks: SocialLinks;
  teamSize: number;
  foundedYear: number | null;
  experienceYears: number;
  completedProjects: number;
  overallRating: number;
  totalReviews: number;
  ratingsBreakdown: RatingsBreakdown;
  services: ProviderService[];
  portfolios: Portfolio[];
  isApproved: boolean;
}

export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

export interface SocialLinks {
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
}

export interface RatingsBreakdown {
  quality: number;
  communication: number;
  timeliness: number;
  value: number;
}

export interface ProviderService {
  id: string;
  name: string;
  key: string;
}

export interface Portfolio {
  id: string;
  title: string;
  imageUrl: string;
  projectType?: string;
  projectYear?: number;
}

export interface ProviderReview {
  id: string;
  providerId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string | null;
  overallRating: number;
  ratingsBreakdown: RatingsBreakdown;
  reviewText: string | null;
  projectType: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface CreateReviewData {
  providerId: string;
  overallRating: number;
  ratingsBreakdown: RatingsBreakdown;
  reviewText?: string;
  projectType?: string;
}

export interface UpdateProviderProfileData {
  companyName?: string;
  bio?: string;
  priceRange?: PriceRange;
  socialLinks?: SocialLinks;
  teamSize?: number;
  foundedYear?: number;
  experienceYears?: number;
  completedProjects?: number;
  isApproved?: boolean;
}

export interface CreateServiceData {
  serviceName: string;
  serviceKey: string;
  displayOrder?: number;
}

export interface CreatePortfolioData {
  title: string;
  description?: string;
  projectType?: string;
  projectYear?: number;
  displayOrder?: number;
}
