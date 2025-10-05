import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { ProviderMapper } from './ProviderMapper';
import {
  ProviderProfile,
  ProviderReview,
  UpdateProviderProfileData,
  CreateReviewData,
  CreateServiceData,
  CreatePortfolioData,
} from '../domain/Provider.types';

export class ProviderRepository {
  async getFullProfile(providerId: string): Promise<Result<ProviderProfile | null, Error>> {
    try {
      const { data, error } = await supabase.rpc('get_provider_full_profile', {
        provider_uuid: providerId,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      if (!data || data.length === 0) {
        return Result.ok(null);
      }

      const profile = ProviderMapper.toProviderProfile(data[0]);
      return Result.ok(profile);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getReviews(providerId: string, limit = 20, offset = 0): Promise<Result<ProviderReview[], Error>> {
    try {
      const { data, error } = await supabase
        .from('provider_reviews')
        .select(`
          *,
          reviewer:app_users!provider_reviews_reviewer_id_fkey(username, avatar_url)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const reviews = (data || []).map((row) => {
        const reviewer = row.reviewer as any;
        return ProviderMapper.toProviderReview({
          ...row,
          reviewer_username: reviewer?.username || 'Anonymous',
          reviewer_avatar: reviewer?.avatar_url || null,
        });
      });

      return Result.ok(reviews);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateProfile(
    providerId: string,
    data: UpdateProviderProfileData
  ): Promise<Result<ProviderProfile, Error>> {
    try {
      const updateData: Record<string, unknown> = {};
      if (data.companyName !== undefined) updateData.company_name = data.companyName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.priceRange !== undefined) updateData.price_range = data.priceRange;
      if (data.socialLinks !== undefined) updateData.social_links = data.socialLinks;
      if (data.teamSize !== undefined) updateData.team_size = data.teamSize;
      if (data.foundedYear !== undefined) updateData.founded_year = data.foundedYear;
      if (data.experienceYears !== undefined) updateData.experience_years = data.experienceYears;
      if (data.completedProjects !== undefined) updateData.completed_projects = data.completedProjects;
      if (data.isApproved !== undefined) updateData.is_approved = data.isApproved;

      const { error } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('id', providerId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const profileResult = await this.getFullProfile(providerId);
      if (profileResult.isFailure()) {
        return Result.fail(profileResult.getError());
      }

      const profile = profileResult.getValue();
      if (!profile) {
        return Result.fail(new Error('Profile not found after update'));
      }

      return Result.ok(profile);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async uploadLogo(providerId: string, file: File): Promise<Result<string, Error>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${providerId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        return Result.fail(new Error(uploadError.message));
      }

      const { data: urlData } = supabase.storage
        .from('provider-assets')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('app_users')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', providerId);

      if (updateError) {
        return Result.fail(new Error(updateError.message));
      }

      return Result.ok(urlData.publicUrl);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async uploadPortfolioImage(providerId: string, file: File): Promise<Result<string, Error>> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${providerId}/portfolio-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-assets')
        .upload(fileName, file);

      if (uploadError) {
        return Result.fail(new Error(uploadError.message));
      }

      const { data: urlData } = supabase.storage
        .from('provider-assets')
        .getPublicUrl(fileName);

      return Result.ok(urlData.publicUrl);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async addService(providerId: string, data: CreateServiceData): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('provider_services').insert({
        provider_id: providerId,
        service_name: data.serviceName,
        service_key: data.serviceKey,
        display_order: data.displayOrder || 0,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async removeService(serviceId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('provider_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async addPortfolio(
    providerId: string,
    imageUrl: string,
    data: CreatePortfolioData
  ): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('provider_portfolios').insert({
        provider_id: providerId,
        title: data.title,
        description: data.description,
        image_url: imageUrl,
        project_type: data.projectType,
        project_year: data.projectYear,
        display_order: data.displayOrder || 0,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async removePortfolio(portfolioId: string): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase
        .from('provider_portfolios')
        .delete()
        .eq('id', portfolioId);

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async createReview(reviewerId: string, data: CreateReviewData): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.from('provider_reviews').insert({
        provider_id: data.providerId,
        reviewer_id: reviewerId,
        overall_rating: data.overallRating,
        ratings_breakdown: data.ratingsBreakdown,
        review_text: data.reviewText,
        project_type: data.projectType,
      });

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
