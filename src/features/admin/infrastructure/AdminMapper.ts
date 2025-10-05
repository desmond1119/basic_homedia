import {
  AdminStats,
  Category,
  ProviderType,
  UserApproval,
  PortfolioApproval,
  GlobalSettings,
} from '../domain/Admin.types';

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id: string | null;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface ProviderTypeRow {
  id: string;
  type_name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserApprovalRow {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
}

interface PortfolioApprovalRow {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  username: string;
}

export class AdminMapper {
  static toAdminStats(row: Record<string, number>): AdminStats {
    return {
      totalUsers: row.total_users || 0,
      totalProviders: row.total_providers || 0,
      totalHomeowners: row.total_homeowners || 0,
      totalPosts: row.total_posts || 0,
      totalReviews: row.total_reviews || 0,
      pendingPortfolios: row.pending_portfolios || 0,
      newUsersWeek: row.new_users_week || 0,
      newUsersMonth: row.new_users_month || 0,
    };
  }

  static toCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      parentId: row.parent_id,
      featured: row.featured,
      displayOrder: row.display_order,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static buildCategoryHierarchy(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return rootCategories;
  }

  static toProviderType(row: ProviderTypeRow): ProviderType {
    return {
      id: row.id,
      typeName: row.type_name,
      displayName: row.display_name,
      description: row.description,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  static toUserApproval(row: UserApprovalRow): UserApproval {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      role: row.role as 'homeowner' | 'provider' | 'admin',
      fullName: row.full_name,
      isActive: row.is_active,
      isApproved: row.is_approved,
      createdAt: new Date(row.created_at),
    };
  }

  static toPortfolioApproval(row: PortfolioApprovalRow): PortfolioApproval {
    return {
      id: row.id,
      userId: row.user_id,
      username: row.username,
      title: row.title,
      status: row.status as 'pending' | 'approved' | 'rejected',
      createdAt: new Date(row.created_at),
    };
  }

  static toGlobalSettings(rows: Array<{ setting_key: string; setting_value: unknown }>): GlobalSettings {
    const settings: Record<string, unknown> = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    return {
      siteName: (settings.site_name as string) || 'Homedia',
      darkMode: (settings.dark_mode as boolean) || false,
      featuredCategories: (settings.featured_categories as string[]) || [],
    };
  }
}
