import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { AdminMapper } from './AdminMapper';
import {
  AdminStats,
  Category,
  ProviderType,
  UserApproval,
  PortfolioApproval,
  GlobalSettings,
  AnalyticsData,
  CreateCategoryData,
  UpdateCategoryData,
  CreateProviderTypeData,
  UpdateProviderTypeData,
} from '../domain/Admin.types';

export class AdminRepository {
  async fetchAdminStats(): Promise<Result<AdminStats, Error>> {
    try {
      const { data, error } = await supabase.from('admin_stats').select('*').single();

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(AdminMapper.toAdminStats(data));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchCategories(): Promise<Result<Category[], Error>> {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) return Result.fail(new Error(error.message));
      const categories = (data || []).map((row: any) => AdminMapper.toCategory(row));
      return Result.ok(AdminMapper.buildCategoryHierarchy(categories));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async createCategory(categoryData: CreateCategoryData): Promise<Result<Category, Error>> {
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryData.name)
        .maybeSingle();

      if (existing) return Result.fail(new Error('CATEGORY_NAME_EXISTS'));

      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          slug: categoryData.name.toLowerCase().replace(/\s+/g, '-'),
          description: categoryData.description || null,
          icon: categoryData.icon || null,
          parent_id: categoryData.parentId || null,
          display_order: categoryData.displayOrder || 0,
          is_active: true,
        })
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(AdminMapper.toCategory(data as any));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateCategory(id: string, categoryData: UpdateCategoryData): Promise<Result<Category, Error>> {
    try {
      // Check uniqueness if name is being changed
      if (categoryData.name) {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', categoryData.name)
          .neq('id', id)
          .maybeSingle();

        if (existing) return Result.fail(new Error('CATEGORY_NAME_EXISTS'));
      }

      const updateData: Record<string, unknown> = {};
      if (categoryData.name !== undefined) updateData.name = categoryData.name;
      if (categoryData.description !== undefined) updateData.description = categoryData.description;
      if (categoryData.icon !== undefined) updateData.icon = categoryData.icon;
      if (categoryData.parentId !== undefined) updateData.parent_id = categoryData.parentId;
      if (categoryData.displayOrder !== undefined) updateData.display_order = categoryData.displayOrder;

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(AdminMapper.toCategory(data as any));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteCategory(id: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchProviderTypes(): Promise<Result<ProviderType[], Error>> {
    try {
      const { data, error } = await supabase
        .from('provider_types')
        .select('*')
        .order('display_name', { ascending: true });

      if (error) return Result.fail(new Error(error.message));
      return Result.ok((data || []).map((row: any) => AdminMapper.toProviderType(row)));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async createProviderType(typeData: CreateProviderTypeData): Promise<Result<ProviderType, Error>> {
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('provider_types')
        .select('id')
        .or(`type_name.ilike.${typeData.typeName},display_name.ilike.${typeData.displayName}`)
        .maybeSingle();

      if (existing) return Result.fail(new Error('PROVIDER_TYPE_EXISTS'));

      const { data, error } = await supabase
        .from('provider_types')
        .insert({
          type_name: typeData.typeName,
          display_name: typeData.displayName,
          description: typeData.description || null,
          is_active: typeData.isActive !== undefined ? typeData.isActive : true,
        })
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(AdminMapper.toProviderType(data));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateProviderType(id: string, typeData: UpdateProviderTypeData): Promise<Result<ProviderType, Error>> {
    try {
      // Check uniqueness if name is being changed
      if (typeData.typeName || typeData.displayName) {
        const conditions = [];
        if (typeData.typeName) conditions.push(`type_name.ilike.${typeData.typeName}`);
        if (typeData.displayName) conditions.push(`display_name.ilike.${typeData.displayName}`);
        
        const { data: existing } = await supabase
          .from('provider_types')
          .select('id')
          .or(conditions.join(','))
          .neq('id', id)
          .maybeSingle();

        if (existing) return Result.fail(new Error('PROVIDER_TYPE_EXISTS'));
      }

      const updateData: Record<string, unknown> = {};
      if (typeData.typeName !== undefined) updateData.type_name = typeData.typeName;
      if (typeData.displayName !== undefined) updateData.display_name = typeData.displayName;
      if (typeData.description !== undefined) updateData.description = typeData.description;
      if (typeData.isActive !== undefined) updateData.is_active = typeData.isActive;

      const { data, error } = await supabase
        .from('provider_types')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(AdminMapper.toProviderType(data));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteProviderType(id: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('provider_types').delete().eq('id', id);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchUsers(role?: string): Promise<Result<UserApproval[], Error>> {
    try {
      let query = supabase.from('app_users').select('*').order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }

      const { data, error } = await query;

      if (error) return Result.fail(new Error(error.message));
      return Result.ok((data || []).map((row: any) => AdminMapper.toUserApproval(row)));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async approveUser(userId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('app_users').update({ is_active: true } as any).eq('id', userId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateUserRole(userId: string, role: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('app_users').update({ role }).eq('id', userId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchPendingPortfolios(): Promise<Result<PortfolioApproval[], Error>> {
    try {
      const { data, error } = await supabase
        .from('portfolios')
        .select('id, user_id, title, status, created_at, app_users!inner(username)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) return Result.fail(new Error(error.message));
      
      const portfolios = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        username: (item.app_users as Record<string, string>).username,
        title: item.title,
        status: item.status,
        created_at: item.created_at,
      }));

      return Result.ok(portfolios.map((row: any) => AdminMapper.toPortfolioApproval(row)));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async approvePortfolio(portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('portfolios').update({ status: 'approved' }).eq('id', portfolioId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async rejectPortfolio(portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('portfolios').update({ status: 'rejected' }).eq('id', portfolioId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchGlobalSettings(): Promise<Result<GlobalSettings, Error>> {
    try {
      return Result.ok({
        siteName: 'Homedia',
        darkMode: false,
        featuredCategories: [],
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateGlobalSettings(settings: Partial<GlobalSettings>): Promise<Result<boolean, Error>> {
    try {
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async fetchAnalytics(): Promise<Result<AnalyticsData, Error>> {
    try {
      return Result.ok({
        engagementByCategory: [],
        collectsByCategory: [],
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  subscribeToCategories(callback: (categories: Category[]) => void): () => void {
    const channel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async () => {
        const result = await this.fetchCategories();
        if (result.isSuccess()) {
          callback(result.getValue());
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }

  subscribeToProviderTypes(callback: (types: ProviderType[]) => void): () => void {
    const channel = supabase
      .channel('provider-types-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'provider_types' }, async () => {
        const result = await this.fetchProviderTypes();
        if (result.isSuccess()) {
          callback(result.getValue());
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}
