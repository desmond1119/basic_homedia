import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { supabase } from '@/core/infrastructure/supabase/client';
import type { ProviderProfile } from '@/core/domain/entities/Provider';

interface ProviderResponse {
  id: string;
  user_id: string;
  company_name: string;
  logo_url: string | null;
  bio: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  overall_rating: number;
  total_reviews: number;
  completed_projects: number;
  experience_years: number;
  team_size: number;
  founded_year: number | null;
  is_approved: boolean;
}

interface FetchProvidersParams {
  limit?: number;
  offset?: number;
  filters?: {
    isApproved?: boolean;
    minRating?: number;
  };
}

export const providerApi = createApi({
  reducerPath: 'providerApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Provider', 'ProviderProfile'],
  endpoints: (builder) => ({
    getProviders: builder.query<ProviderProfile[], FetchProvidersParams>({
      queryFn: async ({ limit = 20, offset = 0, filters = {} }) => {
        try {
          let query = supabase
            .from('provider_profiles')
            .select('*')
            .range(offset, offset + limit - 1);

          if (filters.isApproved !== undefined) {
            query = query.eq('is_approved', filters.isApproved);
          }

          if (filters.minRating) {
            query = query.gte('overall_rating', filters.minRating);
          }

          const { data, error } = await query;

          if (error) throw error;

          const providers: ProviderProfile[] = (data as ProviderResponse[]).map((p) => ({
            id: p.id,
            userId: p.user_id,
            companyName: p.company_name,
            logoUrl: p.logo_url ?? '',
            bio: p.bio ?? '',
            priceRange: {
              min: p.price_min ?? 0,
              max: p.price_max ?? 0,
              currency: p.currency,
            },
            overallRating: p.overall_rating,
            totalReviews: p.total_reviews,
            completedProjects: p.completed_projects,
            experienceYears: p.experience_years,
            teamSize: p.team_size,
            foundedYear: p.founded_year ?? 0,
            isApproved: p.is_approved,
            services: [],
            portfolios: [],
            ratingsBreakdown: {},
            socialLinks: {},
          }));

          return { data: providers };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Provider' as const, id })), { type: 'Provider', id: 'LIST' }]
          : [{ type: 'Provider', id: 'LIST' }],
    }),

    getProviderById: builder.query<ProviderProfile, string>({
      queryFn: async (providerId) => {
        try {
          const { data, error } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('id', providerId)
            .single();

          if (error) throw error;

          const p = data as ProviderResponse;
          const provider: ProviderProfile = {
            id: p.id,
            userId: p.user_id,
            companyName: p.company_name,
            logoUrl: p.logo_url ?? '',
            bio: p.bio ?? '',
            priceRange: {
              min: p.price_min ?? 0,
              max: p.price_max ?? 0,
              currency: p.currency,
            },
            overallRating: p.overall_rating,
            totalReviews: p.total_reviews,
            completedProjects: p.completed_projects,
            experienceYears: p.experience_years,
            teamSize: p.team_size,
            foundedYear: p.founded_year ?? 0,
            isApproved: p.is_approved,
            services: [],
            portfolios: [],
            ratingsBreakdown: {},
            socialLinks: {},
          };

          return { data: provider };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      providesTags: (result, error, id) => [{ type: 'ProviderProfile', id }],
    }),

    updateProvider: builder.mutation<ProviderProfile, Partial<ProviderProfile> & { id: string }>({
      queryFn: async (provider) => {
        try {
          const updateData: Partial<ProviderResponse> = {
            company_name: provider.companyName,
            bio: provider.bio,
            logo_url: provider.logoUrl,
            price_min: provider.priceRange?.min,
            price_max: provider.priceRange?.max,
            currency: provider.priceRange?.currency,
            team_size: provider.teamSize,
            founded_year: provider.foundedYear,
          };

          const { data, error } = await supabase
            .from('provider_profiles')
            .update(updateData)
            .eq('id', provider.id)
            .select()
            .single();

          if (error) throw error;

          const p = data as ProviderResponse;
          const updated: ProviderProfile = {
            id: p.id,
            userId: p.user_id,
            companyName: p.company_name,
            logoUrl: p.logo_url ?? '',
            bio: p.bio ?? '',
            priceRange: {
              min: p.price_min ?? 0,
              max: p.price_max ?? 0,
              currency: p.currency,
            },
            overallRating: p.overall_rating,
            totalReviews: p.total_reviews,
            completedProjects: p.completed_projects,
            experienceYears: p.experience_years,
            teamSize: p.team_size,
            foundedYear: p.founded_year ?? 0,
            isApproved: p.is_approved,
            services: [],
            portfolios: [],
            ratingsBreakdown: {},
            socialLinks: {},
          };

          return { data: updated };
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'ProviderProfile', id },
        { type: 'Provider', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetProvidersQuery, useGetProviderByIdQuery, useUpdateProviderMutation } = providerApi;
