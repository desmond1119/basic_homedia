import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderRepository } from '../ProviderRepository';
import { mockSupabaseClient, resetMocks } from '@/test/mocks/supabase';

vi.mock('@/core/infrastructure/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('ProviderRepository', () => {
  let repository: ProviderRepository;

  beforeEach(() => {
    resetMocks();
    repository = new ProviderRepository();
  });

  describe('getFullProfile', () => {
    it('should return provider profile on success', async () => {
      const mockData = [{
        id: 'provider-1',
        username: 'testprovider',
        company_name: 'Test Company',
        logo_url: 'https://example.com/logo.png',
        avatar_url: null,
        bio: 'Test bio',
        price_range: { design: 'HKD 10,000-50,000' },
        social_links: { website: 'https://test.com', email: 'test@example.com' },
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
        services: [],
        portfolios: [],
      }];

      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: mockData, error: null });

      const result = await repository.getFullProfile('provider-1');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()?.id).toBe('provider-1');
      expect(result.getValue()?.companyName).toBe('Test Company');
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_provider_full_profile', {
        provider_uuid: 'provider-1',
      });
    });

    it('should return null when provider not found', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({ data: [], error: null });

      const result = await repository.getFullProfile('nonexistent');

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBeNull();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'PGRST116' },
      });

      const result = await repository.getFullProfile('provider-1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Database error');
    });

    it('should handle network errors', async () => {
      mockSupabaseClient.rpc.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await repository.getFullProfile('provider-1');

      expect(result.isFailure()).toBe(true);
      expect(result.getError().message).toBe('Network timeout');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updateData = { companyName: 'New Company', bio: 'New bio' };
      
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });
      
      mockSupabaseClient.rpc.mockResolvedValueOnce({
        data: [{
          id: 'provider-1',
          company_name: 'New Company',
          bio: 'New bio',
          services: [],
          portfolios: [],
          price_range: {},
          social_links: {},
        }],
        error: null,
      });

      const result = await repository.updateProfile('provider-1', updateData);

      expect(result.isSuccess()).toBe(true);
    });

    it('should handle update errors', async () => {
      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      });

      const result = await repository.updateProfile('provider-1', { bio: 'test' });

      expect(result.isFailure()).toBe(true);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo and return public URL', async () => {
      const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });
      const mockUrl = 'https://storage.supabase.co/logo.png';

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        upload: vi.fn().mockResolvedValueOnce({ error: null }),
        getPublicUrl: vi.fn().mockReturnValueOnce({ data: { publicUrl: mockUrl } }),
      });

      mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
      mockSupabaseClient.eq.mockResolvedValueOnce({ error: null });

      const result = await repository.uploadLogo('provider-1', mockFile);

      expect(result.isSuccess()).toBe(true);
      expect(result.getValue()).toBe(mockUrl);
    });

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'logo.png', { type: 'image/png' });

      mockSupabaseClient.storage.from.mockReturnValueOnce({
        upload: vi.fn().mockResolvedValueOnce({ error: { message: 'Upload failed' } }),
      });

      const result = await repository.uploadLogo('provider-1', mockFile);

      expect(result.isFailure()).toBe(true);
    });
  });
});
