export interface FeatureFlags {
  newForumUI: boolean;
  advancedSearch: boolean;
  aiRecommendations: boolean;
  realTimeNotifications: boolean;
  betaFeatures: boolean;
  cdnImages: boolean;
  lazyLoadImages: boolean;
  virtualScrolling: boolean;
  httpOnlyCookies: boolean;
}

const getDefaultFlags = (): FeatureFlags => ({
  newForumUI: true,
  advancedSearch: false,
  aiRecommendations: false,
  realTimeNotifications: false,
  betaFeatures: import.meta.env.DEV,
  cdnImages: true,
  lazyLoadImages: true,
  virtualScrolling: false,
  httpOnlyCookies: true,
});

class FeatureFlagService {
  private flags: FeatureFlags;

  constructor() {
    this.flags = this.loadFlags();
  }

  private loadFlags(): FeatureFlags {
    const stored = localStorage.getItem('featureFlags');
    if (stored) {
      try {
        return { ...getDefaultFlags(), ...JSON.parse(stored) };
      } catch {
        return getDefaultFlags();
      }
    }
    return getDefaultFlags();
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags[flag];
  }

  enable(flag: keyof FeatureFlags): void {
    this.flags[flag] = true;
    this.persist();
  }

  disable(flag: keyof FeatureFlags): void {
    this.flags[flag] = false;
    this.persist();
  }

  toggle(flag: keyof FeatureFlags): void {
    this.flags[flag] = !this.flags[flag];
    this.persist();
  }

  private persist(): void {
    localStorage.setItem('featureFlags', JSON.stringify(this.flags));
  }

  getAll(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagService();
