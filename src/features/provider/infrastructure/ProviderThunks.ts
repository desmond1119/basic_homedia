import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';

export interface Provider {
  id: string;
  user_id: string;
  provider_type: string;
  company_name: string;
  bio: string;
  logo_url?: string;
  price_min?: number;
  price_max?: number;
  currency: string;
  experience_years?: number;
  team_size?: number;
  founded_year?: number;
  social_links: Record<string, string>;
  is_approved: boolean;
  location?: string;
  tags: string[];
  rating_avg: number;
  review_count: number;
  portfolio_count: number;
  follower_count: number;
  created_at: string;
  updated_at: string;
  type_display_name?: string;
  type_description?: string;
  services?: string[];
  badge?: 'new' | 'top_rated' | 'experienced' | 'standard';
}

export interface ProviderFilters {
  page?: number;
  limit?: number;
  type?: string;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  tags?: string[];
  search?: string;
  sortBy?: 'rating' | 'reviews' | 'newest' | 'price_low' | 'price_high';
}

export interface ProviderReview {
  id: string;
  provider_id: string;
  user_id: string;
  rating: number;
  ratings_detail: {
    quality?: number;
    communication?: number;
    timeliness?: number;
    value?: number;
  };
  title?: string;
  content?: string;
  media_urls?: string[];
  is_verified: boolean;
  helpful_count: number;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

// Fetch providers with filters and pagination
export const fetchProvidersThunk = createAsyncThunk(
  'provider/fetchProviders',
  async (filters: ProviderFilters = {}) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        location, 
        priceMin, 
        priceMax, 
        ratingMin, 
        tags, 
        search, 
        sortBy = 'rating' 
      } = filters;
      
      const offset = (page - 1) * limit;

      let query = supabase
        .from('providers_feed')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('provider_type', type);
      }

      if (location) {
        query = query.ilike('location', `%${location}%`);
      }

      if (priceMin !== undefined) {
        query = query.gte('price_min', priceMin);
      }

      if (priceMax !== undefined) {
        query = query.lte('price_max', priceMax);
      }

      if (ratingMin !== undefined) {
        query = query.gte('rating_avg', ratingMin);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      if (search) {
        query = query.or(`company_name.ilike.%${search}%,bio.ilike.%${search}%`);
      }

      switch (sortBy) {
        case 'rating':
          query = query.order('rating_avg', { ascending: false });
          break;
        case 'reviews':
          query = query.order('review_count', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'price_low':
          query = query.order('price_min', { ascending: true });
          break;
        case 'price_high':
          query = query.order('price_max', { ascending: false });
          break;
      }

      const { data, error, count } = await query;

      if (error) {
        return Result.fail<{ providers: Provider[]; total: number }>(error.message);
      }

      return Result.ok({ providers: data || [], total: count || 0 });
    } catch (error) {
      return Result.fail<{ providers: Provider[]; total: number }>('Failed to fetch providers');
    }
  }
);

// Approve provider (admin only)
export const approveProviderThunk = createAsyncThunk(
  'provider/approveProvider',
  async (providerId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<Provider>('User not authenticated');
      }

      // Check if user is admin (you may want to implement proper role checking)
      const { data: appUser } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser || appUser.role !== 'admin') {
        return Result.fail<Provider>('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('provider_profiles')
        .update({ 
          is_approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId)
        .select()
        .single();

      if (error) {
        return Result.fail<Provider>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<Provider>('Failed to approve provider');
    }
  }
);

// Follow provider
export const followProviderThunk = createAsyncThunk(
  'provider/followProvider',
  async (providerId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<void>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<void>('User profile not found');
      }

      // Check if already following
      const { data: existing } = await supabase
        .from('provider_follows')
        .select('id')
        .eq('provider_id', providerId)
        .eq('user_id', appUser.id)
        .single();

      if (existing) {
        // Unfollow
        const { error } = await supabase
          .from('provider_follows')
          .delete()
          .eq('provider_id', providerId)
          .eq('user_id', appUser.id);

        if (error) {
          return Result.fail<void>(error.message);
        }

        return Result.ok(undefined);
      } else {
        // Follow
        const { error } = await supabase
          .from('provider_follows')
          .insert({
            provider_id: providerId,
            user_id: appUser.id
          });

        if (error) {
          return Result.fail<void>(error.message);
        }

        return Result.ok(undefined);
      }
    } catch (error) {
      return Result.fail<void>('Failed to follow/unfollow provider');
    }
  }
);

// Collect/Bookmark provider
export const collectProviderThunk = createAsyncThunk(
  'provider/collectProvider',
  async (providerId: string) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<void>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<void>('User profile not found');
      }

      // Check if already bookmarked
      const { data: existing } = await supabase
        .from('provider_bookmarks')
        .select('id')
        .eq('provider_id', providerId)
        .eq('user_id', appUser.id)
        .single();

      if (existing) {
        // Remove bookmark
        const { error } = await supabase
          .from('provider_bookmarks')
          .delete()
          .eq('provider_id', providerId)
          .eq('user_id', appUser.id);

        if (error) {
          return Result.fail<void>(error.message);
        }

        return Result.ok(undefined);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('provider_bookmarks')
          .insert({
            provider_id: providerId,
            user_id: appUser.id
          });

        if (error) {
          return Result.fail<void>(error.message);
        }

        return Result.ok(undefined);
      }
    } catch (error) {
      return Result.fail<void>('Failed to bookmark provider');
    }
  }
);

// Fetch provider reviews
export const fetchProviderReviewsThunk = createAsyncThunk(
  'provider/fetchReviews',
  async ({ providerId, page = 1, limit = 10 }: { providerId: string; page?: number; limit?: number }) => {
    try {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from('provider_reviews')
        .select(`
          *,
          app_users!inner (
            username,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return Result.fail<{ reviews: ProviderReview[]; total: number }>(error.message);
      }

      const reviews = data?.map(review => ({
        ...review,
        username: review.app_users?.username,
        avatar_url: review.app_users?.avatar_url,
      })) || [];

      return Result.ok({ reviews, total: count || 0 });
    } catch (error) {
      return Result.fail<{ reviews: ProviderReview[]; total: number }>('Failed to fetch reviews');
    }
  }
);

// Create provider review
export const createProviderReviewThunk = createAsyncThunk(
  'provider/createReview',
  async (reviewData: {
    providerId: string;
    rating: number;
    ratingsDetail?: Record<string, number>;
    title?: string;
    content?: string;
    mediaUrls?: string[];
  }) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return Result.fail<ProviderReview>('User not authenticated');
      }

      const { data: appUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('auth_id', userData.user.id)
        .single();

      if (!appUser) {
        return Result.fail<ProviderReview>('User profile not found');
      }

      const { data, error } = await supabase
        .from('provider_reviews')
        .insert({
          provider_id: reviewData.providerId,
          user_id: appUser.id,
          rating: reviewData.rating,
          ratings_detail: reviewData.ratingsDetail || {},
          title: reviewData.title,
          content: reviewData.content,
          media_urls: reviewData.mediaUrls || []
        })
        .select()
        .single();

      if (error) {
        return Result.fail<ProviderReview>(error.message);
      }

      return Result.ok(data);
    } catch (error) {
      return Result.fail<ProviderReview>('Failed to create review');
    }
  }
);
