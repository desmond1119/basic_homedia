import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlags } from './featureFlags';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should check if flag is enabled', () => {
    expect(featureFlags.isEnabled('newForumUI')).toBe(true);
    expect(featureFlags.isEnabled('advancedSearch')).toBe(false);
  });

  it('should enable a flag', () => {
    featureFlags.enable('advancedSearch');
    expect(featureFlags.isEnabled('advancedSearch')).toBe(true);
  });

  it('should disable a flag', () => {
    featureFlags.disable('newForumUI');
    expect(featureFlags.isEnabled('newForumUI')).toBe(false);
  });

  it('should toggle a flag', () => {
    const initial = featureFlags.isEnabled('aiRecommendations');
    featureFlags.toggle('aiRecommendations');
    expect(featureFlags.isEnabled('aiRecommendations')).toBe(!initial);
  });

  it('should get all flags', () => {
    const flags = featureFlags.getAll();
    expect(flags).toHaveProperty('newForumUI');
    expect(flags).toHaveProperty('cdnImages');
    expect(flags).toHaveProperty('httpOnlyCookies');
  });

  it('should persist flags to localStorage', () => {
    featureFlags.enable('advancedSearch');
    const stored = localStorage.getItem('featureFlags');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.advancedSearch).toBe(true);
  });
});
