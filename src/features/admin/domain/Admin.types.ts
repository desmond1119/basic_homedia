export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalHomeowners: number;
  totalPosts: number;
  totalReviews: number;
  pendingPortfolios: number;
  newUsersWeek: number;
  newUsersMonth: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  featured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  children?: Category[];
}

export interface ProviderType {
  id: string;
  typeName: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserApproval {
  id: string;
  username: string;
  email: string;
  role: 'homeowner' | 'provider' | 'admin';
  fullName: string | null;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
}

export interface PortfolioApproval {
  id: string;
  userId: string;
  username: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface GlobalSettings {
  siteName: string;
  darkMode: boolean;
  featuredCategories: string[];
}

export interface AnalyticsData {
  engagementByCategory: Array<{ category: string; count: number }>;
  collectsByCategory: Array<{ category: string; count: number }>;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
  featured?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CreateProviderTypeData {
  typeName: string;
  displayName: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateProviderTypeData extends Partial<CreateProviderTypeData> {}
