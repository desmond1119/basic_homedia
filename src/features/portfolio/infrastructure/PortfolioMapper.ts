import {
  Portfolio,
  PortfolioImage,
  PortfolioCategory,
  PortfolioCollect,
} from '../domain/Portfolio.types';

interface PortfolioRow {
  id: string;
  user_id: string;
  title: string;
  address: string | null;
  area_sqft: number | null;
  total_cost: number | null;
  currency: string;
  description: string | null;
  cover_image_url: string | null;
  status: string;
  collects_count: number;
  impressions_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  company_name?: string;
  logo_url?: string | null;
  images?: Array<Record<string, unknown>>;
}

interface ImageRow {
  id: string;
  portfolio_id: string;
  image_url: string;
  description: string | null;
  category_id: string | null;
  display_order: number;
  file_type: string;
}

interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
}

export class PortfolioMapper {
  static toPortfolio(row: PortfolioRow): Portfolio {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      address: row.address,
      areaSqft: row.area_sqft,
      totalCost: row.total_cost,
      currency: row.currency || 'HKD',
      description: row.description,
      coverImageUrl: row.cover_image_url,
      status: row.status as 'pending' | 'approved' | 'rejected',
      collectsCount: row.collects_count || 0,
      impressionsCount: row.impressions_count || 0,
      isFeatured: row.is_featured || false,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      username: row.username,
      companyName: row.company_name,
      logoUrl: row.logo_url,
      images: row.images ? this.toImages(row.images) : [],
    };
  }

  static toImage(row: ImageRow): PortfolioImage {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      imageUrl: row.image_url,
      description: row.description,
      categoryId: row.category_id,
      displayOrder: row.display_order || 0,
      fileType: (row.file_type as 'image' | 'video') || 'image',
    };
  }

  static toImages(data: Array<Record<string, unknown>>): PortfolioImage[] {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      id: String(item.id || ''),
      portfolioId: String(item.portfolioId || ''),
      imageUrl: String(item.imageUrl || ''),
      description: item.description ? String(item.description) : null,
      categoryId: item.categoryId ? String(item.categoryId) : null,
      displayOrder: typeof item.displayOrder === 'number' ? item.displayOrder : 0,
      fileType: (item.fileType as 'image' | 'video') || 'image',
    }));
  }

  static toCategory(row: CategoryRow): PortfolioCategory {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      displayOrder: row.display_order || 0,
      isActive: row.is_active !== false,
    };
  }

  static buildCategoryHierarchy(categories: PortfolioCategory[]): PortfolioCategory[] {
    const categoryMap = new Map<string, PortfolioCategory>();
    const rootCategories: PortfolioCategory[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    categories.forEach((cat) => {
      const category = categoryMap.get(cat.id);
      if (!category) return;

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

    return rootCategories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  static toCollect(row: { id: string; portfolio_id: string; user_id: string; created_at: string }): PortfolioCollect {
    return {
      id: row.id,
      portfolioId: row.portfolio_id,
      userId: row.user_id,
      createdAt: new Date(row.created_at),
    };
  }
}
