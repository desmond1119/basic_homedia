import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { PortfolioMapper } from './PortfolioMapper';
import {
  Portfolio,
  PortfolioImage,
  PortfolioCategory,
  CreatePortfolioData,
  UpdatePortfolioData,
  AddPortfolioImageData,
  PortfolioFilters,
  PortfolioSort,
  PortfolioAnalytics,
} from '../domain/Portfolio.types';

export class PortfolioRepository {
  async createPortfolio(userId: string, data: CreatePortfolioData): Promise<Result<Portfolio, Error>> {
    try {
      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .insert({
          user_id: userId,
          title: data.title,
          address: data.address,
          area_sqft: data.areaSqft,
          total_cost: data.totalCost,
          currency: data.currency || 'HKD',
          description: data.description,
        })
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      if (!portfolio) return Result.fail(new Error('Failed to create portfolio'));

      return Result.ok(PortfolioMapper.toPortfolio(portfolio));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updatePortfolio(portfolioId: string, data: UpdatePortfolioData): Promise<Result<Portfolio, Error>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.areaSqft !== undefined) updateData.area_sqft = data.areaSqft;
      if (data.totalCost !== undefined) updateData.total_cost = data.totalCost;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.coverImageUrl !== undefined) updateData.cover_image_url = data.coverImageUrl;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isFeatured !== undefined) updateData.is_featured = data.isFeatured;

      const { data: portfolio, error } = await supabase
        .from('portfolios')
        .update(updateData)
        .eq('id', portfolioId)
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      if (!portfolio) return Result.fail(new Error('Portfolio not found'));

      return Result.ok(PortfolioMapper.toPortfolio(portfolio));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getPortfolio(portfolioId: string): Promise<Result<Portfolio | null, Error>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_feed')
        .select('*')
        .eq('id', portfolioId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return Result.ok(null);
        return Result.fail(new Error(error.message));
      }

      return Result.ok(data ? PortfolioMapper.toPortfolio(data) : null);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getPortfolios(
    filters: PortfolioFilters = {},
    sort: PortfolioSort = { field: 'created_at', order: 'desc' },
    limit = 20,
    offset = 0
  ): Promise<Result<Portfolio[], Error>> {
    try {
      let query = supabase.from('portfolio_feed').select('*');

      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.isFeatured !== undefined) query = query.eq('is_featured', filters.isFeatured);

      query = query.order(sort.field, { ascending: sort.order === 'asc' });
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) return Result.fail(new Error(error.message));

      const portfolios = (data || []).map((row) => PortfolioMapper.toPortfolio(row));
      return Result.ok(portfolios);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async addImage(data: AddPortfolioImageData): Promise<Result<PortfolioImage, Error>> {
    try {
      const { data: image, error } = await supabase
        .from('portfolio_images')
        .insert({
          portfolio_id: data.portfolioId,
          image_url: data.imageUrl,
          description: data.description,
          category_id: data.categoryId,
          display_order: data.displayOrder || 0,
          file_type: data.fileType || 'image',
        })
        .select()
        .single();

      if (error) return Result.fail(new Error(error.message));
      if (!image) return Result.fail(new Error('Failed to add image'));

      return Result.ok(PortfolioMapper.toImage(image));
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async uploadFile(file: File, userId: string): Promise<Result<string, Error>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/portfolio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-assets')
        .upload(fileName, file, { upsert: false });

      if (uploadError) return Result.fail(new Error(uploadError.message));

      const { data: urlData } = supabase.storage.from('provider-assets').getPublicUrl(fileName);

      return Result.ok(urlData.publicUrl);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteImage(imageId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('portfolio_images').delete().eq('id', imageId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deletePortfolio(portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('portfolios').delete().eq('id', portfolioId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getCategories(): Promise<Result<PortfolioCategory[], Error>> {
    try {
      const { data, error } = await supabase
        .from('portfolio_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) return Result.fail(new Error(error.message));

      const categories = (data || []).map((row) => PortfolioMapper.toCategory(row));
      const hierarchy = PortfolioMapper.buildCategoryHierarchy(categories);

      return Result.ok(hierarchy);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async collectPortfolio(userId: string, portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('portfolio_collects')
        .insert({ user_id: userId, portfolio_id: portfolioId });

      if (error) {
        if (error.code === '23505') return Result.ok(true);
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async uncollectPortfolio(userId: string, portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('portfolio_collects')
        .delete()
        .eq('user_id', userId)
        .eq('portfolio_id', portfolioId);

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async recordImpression(portfolioId: string, userId?: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.rpc('record_portfolio_impression', {
        p_portfolio_id: portfolioId,
        p_user_id: userId || null,
      });

      if (error) return Result.fail(new Error(error.message));
      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getAnalytics(portfolioId: string, days = 30): Promise<Result<PortfolioAnalytics, Error>> {
    try {
      const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select('collects_count, impressions_count')
        .eq('id', portfolioId)
        .single();

      if (portfolioError) return Result.fail(new Error(portfolioError.message));

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: impressions, error: impressionsError } = await supabase
        .from('portfolio_impressions')
        .select('created_at')
        .eq('portfolio_id', portfolioId)
        .gte('created_at', startDate.toISOString());

      const { data: collects, error: collectsError } = await supabase
        .from('portfolio_collects')
        .select('created_at')
        .eq('portfolio_id', portfolioId)
        .gte('created_at', startDate.toISOString());

      if (impressionsError || collectsError) {
        return Result.fail(new Error('Failed to fetch analytics data'));
      }

      const dailyImpressions = this.aggregateByDay(impressions || [], days);
      const dailyCollects = this.aggregateByDay(collects || [], days);

      return Result.ok({
        portfolioId,
        collectsCount: portfolio?.collects_count || 0,
        impressionsCount: portfolio?.impressions_count || 0,
        dailyImpressions,
        dailyCollects,
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private aggregateByDay(records: { created_at: string }[], days: number): { date: string; count: number }[] {
    const dateMap = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    records.forEach((record) => {
      const dateStr = record.created_at.split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
