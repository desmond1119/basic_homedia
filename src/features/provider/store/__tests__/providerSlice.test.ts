import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  providerReducer,
  fetchProviderProfile,
  fetchProviderReviews,
  updateProviderProfile,
  uploadProviderLogo,
  createProviderReview,
  clearProviderProfile,
} from '../providerSlice';
import { mockSupabaseClient, resetMocks } from '@/test/mocks/supabase';

vi.mock('@/core/infrastructure/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('providerSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    resetMocks();
    store = configureStore({
      reducer: { provider: providerReducer },
    });
  });

  describe('fetchProviderProfile', () => {
    it('should handle pending state', () => {
      const action = { type: fetchProviderProfile.pending.type };
      const state = providerReducer(undefined, action);

      expect(state.fetchProfile.status).toBe('pending');
    });

    it('should handle fulfilled state with valid profile', async () => {
      const mockProfile = {
        id: 'provider-1',
        username: 'testprovider',
        company_name: 'Test Company',
        logo_url: 'https://example.com/logo.png',
        avatar_url: null,
        bio: 'Test bio',
        services: [],
        portfolios: [],
        price_range: { design: 'HKD 10,000-50,000' },
        social_links: { email: 'test@example.com' },
        team_size: 5,
        founded_year: 2020,
        experience_years: 3,
        completed_projects: 10,
        overall_rating: 4.5,
        total_reviews: 20,
        ratings_breakdown: {
          design: 4.5,
          construction: 4.6,
          service: 4.7,
          communication: 4.8,
          timeline: 4.4,
          value: 4.5,
        },
      };

      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [mockProfile],
        error: null,
      });

      await store.dispatch(fetchProviderProfile('provider-1'));
      const state = store.getState().provider;

      expect(state.fetchProfile.status).toBe('succeeded');
      expect(state.currentProfile?.id).toBe('provider-1');
      expect(state.currentProfile?.companyName).toBe('Test Company');
    });

    it('should handle null profile when not found', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await store.dispatch(fetchProviderProfile('nonexistent'));
      const state = store.getState().provider;

      expect(state.fetchProfile.status).toBe('succeeded');
      expect(state.currentProfile).toBeNull();
    });

    it('should handle rejected state with error', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await store.dispatch(fetchProviderProfile('invalid'));
      const state = store.getState().provider;

      expect(state.fetchProfile.status).toBe('failed');
      expect(state.fetchProfile.error).toBeTruthy();
    });

    it('should handle network errors', async () => {
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Network error'));

      await store.dispatch(fetchProviderProfile('provider-1'));
      const state = store.getState().provider;

      expect(state.fetchProfile.status).toBe('failed');
    });
  });

  describe('fetchProviderReviews', () => {
    it('should fetch and append reviews with pagination', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          provider_id: 'provider-1',
          reviewer_id: 'user-1',
          overall_rating: 5,
          ratings_breakdown: { design: 5, construction: 5, service: 5, communication: 5, timeline: 5, value: 5 },
          review_text: 'Great service',
          project_type: 'Renovation',
          is_verified: true,
          created_at: '2024-01-01T00:00:00Z',
          reviewer: { username: 'John Doe', avatar_url: null },
        },
      ];

      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: mockReviews,
        error: null,
      });

      await store.dispatch(fetchProviderReviews({ providerId: 'provider-1', limit: 20, offset: 0 }));
      const state = store.getState().provider;

      expect(state.fetchReviews.status).toBe('succeeded');
      expect(state.reviews).toHaveLength(1);
      expect(state.hasMoreReviews).toBe(false);
    });

    it('should replace reviews when offset is 0', async () => {
      mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.range.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await store.dispatch(fetchProviderReviews({ providerId: 'provider-1', limit: 20, offset: 0 }));
      const state = store.getState().provider;

      expect(state.reviews).toHaveLength(0);
    });
  });

  describe('updateProviderProfile', () => {
    it('should update profile successfully', async () => {
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{
          id: 'provider-1',
          company_name: 'Updated Company',
          services: [],
          portfolios: [],
          price_range: {},
          social_links: {},
          team_size: 10,
          experience_years: 5,
          completed_projects: 20,
          overall_rating: 4.8,
          total_reviews: 30,
          ratings_breakdown: {},
        }],
        error: null,
      });

      await store.dispatch(
        updateProviderProfile({
          providerId: 'provider-1',
          data: { companyName: 'Updated Company', teamSize: 10 },
        })
      );

      const state = store.getState().provider;
      expect(state.updateProfile.status).toBe('succeeded');
      expect(state.currentProfile?.companyName).toBe('Updated Company');
    });

    it('should handle update errors', async () => {
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: { message: 'Permission denied' },
      });

      await store.dispatch(
        updateProviderProfile({
          providerId: 'provider-1',
          data: { bio: 'New bio' },
        })
      );

      const state = store.getState().provider;
      expect(state.updateProfile.status).toBe('failed');
    });
  });

  describe('uploadProviderLogo', () => {
    it('should upload logo and update state', async () => {
      const mockFile = new File(['logo'], 'logo.png', { type: 'image/png' });
      const mockUrl = 'https://storage.example.com/logo.png';

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        upload: vi.fn().mockResolvedValueOnce({ error: null }),
        getPublicUrl: vi.fn().mockReturnValueOnce({ data: { publicUrl: mockUrl } }),
      });

      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      store = configureStore({
        reducer: { provider: providerReducer },
        preloadedState: {
          provider: {
            currentProfile: {
              id: 'provider-1',
              username: 'test',
              companyName: 'Test',
              logoUrl: null,
              avatarUrl: null,
              bio: null,
              priceRange: {},
              socialLinks: {},
              teamSize: 0,
              foundedYear: null,
              experienceYears: 0,
              completedProjects: 0,
              overallRating: 0,
              totalReviews: 0,
              ratingsBreakdown: { design: 0, construction: 0, service: 0, communication: 0, timeline: 0, value: 0 },
              services: [],
              portfolios: [],
            },
            reviews: [],
            hasMoreReviews: true,
            fetchProfile: { status: 'idle', error: null },
            fetchReviews: { status: 'idle', error: null },
            updateProfile: { status: 'idle', error: null },
            uploadLogo: { status: 'idle', error: null },
            uploadPortfolio: { status: 'idle', error: null },
            createReview: { status: 'idle', error: null },
          },
        },
      });

      await store.dispatch(uploadProviderLogo({ providerId: 'provider-1', file: mockFile }));
      const state = store.getState().provider;

      expect(state.uploadLogo.status).toBe('succeeded');
      expect(state.currentProfile?.logoUrl).toBe(mockUrl);
    });
  });

  describe('createProviderReview', () => {
    it('should create review successfully', async () => {
      mockSupabaseClient.insert.mockResolvedValueOnce({ error: null });

      await store.dispatch(
        createProviderReview({
          reviewerId: 'user-1',
          data: {
            providerId: 'provider-1',
            overallRating: 5,
            ratingsBreakdown: { design: 5, construction: 5, service: 5, communication: 5, timeline: 5, value: 5 },
            reviewText: 'Excellent work',
          },
        })
      );

      const state = store.getState().provider;
      expect(state.createReview.status).toBe('succeeded');
    });
  });

  describe('clearProviderProfile', () => {
    it('should clear profile and reviews', () => {
      const state = providerReducer(
        {
          currentProfile: {} as never,
          reviews: [{} as never],
          hasMoreReviews: false,
          fetchProfile: { status: 'idle', error: null },
          fetchReviews: { status: 'idle', error: null },
          updateProfile: { status: 'idle', error: null },
          uploadLogo: { status: 'idle', error: null },
          uploadPortfolio: { status: 'idle', error: null },
          createReview: { status: 'idle', error: null },
        },
        clearProviderProfile()
      );

      expect(state.currentProfile).toBeNull();
      expect(state.reviews).toHaveLength(0);
      expect(state.hasMoreReviews).toBe(true);
    });
  });
});
