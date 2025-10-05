export interface Portfolio {
  id: string;
  userId: string;
  title: string;
  address: string | null;
  areaSqft: number | null;
  totalCost: number | null;
  currency: string;
  description: string | null;
  coverImageUrl: string | null;
  status: 'pending' | 'approved' | 'rejected';
  collectsCount: number;
  impressionsCount: number;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  username?: string;
  companyName?: string;
  logoUrl?: string | null;
  images: PortfolioImage[];
}

export interface PortfolioImage {
  id: string;
  portfolioId: string;
  imageUrl: string;
  description: string | null;
  categoryId: string | null;
  displayOrder: number;
  fileType: 'image' | 'video';
}

export interface PortfolioCategory {
  id: string;
  name: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  children?: PortfolioCategory[];
}

export interface PortfolioCollect {
  id: string;
  portfolioId: string;
  userId: string;
  createdAt: Date;
}

export interface PortfolioAnalytics {
  portfolioId: string;
  collectsCount: number;
  impressionsCount: number;
  dailyImpressions: { date: string; count: number }[];
  dailyCollects: { date: string; count: number }[];
}

export interface CreatePortfolioData {
  title: string;
  address?: string;
  areaSqft?: number;
  totalCost?: number;
  currency?: string;
  description?: string;
}

export interface UpdatePortfolioData {
  title?: string;
  address?: string;
  areaSqft?: number;
  totalCost?: number;
  currency?: string;
  description?: string;
  coverImageUrl?: string;
  status?: 'pending' | 'approved' | 'rejected';
  isFeatured?: boolean;
}

export interface AddPortfolioImageData {
  portfolioId: string;
  imageUrl: string;
  description?: string;
  categoryId?: string;
  displayOrder?: number;
  fileType?: 'image' | 'video';
}

export interface PortfolioFilters {
  categoryId?: string;
  userId?: string;
  status?: 'pending' | 'approved' | 'rejected';
  isFeatured?: boolean;
}

export interface PortfolioSort {
  field: 'created_at' | 'collects_count' | 'impressions_count';
  order: 'asc' | 'desc';
}
