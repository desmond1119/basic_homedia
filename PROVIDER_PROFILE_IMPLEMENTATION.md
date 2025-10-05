# Provider Profile Feature Implementation

## Overview
Complete provider company profile feature with hero section, stats cards, services, price range, social links, multi-dimensional reviews, and portfolio gallery.

## Database Schema

### Migration: `20251006_provider_profile_schema.sql`
- **Extended `app_users`**: Added company_name, logo_url, bio, price_range (JSONB), social_links (JSONB), completed_projects, experience_years, team_size, founded_year, overall_rating, total_reviews
- **Created `provider_reviews`**: id, provider_id, reviewer_id, overall_rating, ratings_breakdown (JSONB: quality/communication/timeliness/value), review_text, project_type, is_verified
- **Created `provider_services`**: id, provider_id, service_key, service_name, display_order, is_active
- **Created `provider_portfolios`**: id, provider_id, title, description, image_url, project_type, project_year, is_featured, display_order
- **View `provider_full_profiles`**: Aggregates provider data with services and portfolios as JSON arrays
- **Function `get_provider_full_profile(UUID)`**: Returns complete profile with aggregated ratings
- **Function `calculate_provider_ratings(UUID)`**: Computes overall_avg, ratings_avg JSONB, total_count
- **Trigger `update_provider_ratings`**: Auto-updates app_users.overall_rating and total_reviews on review changes
- **RLS Policies**: Reviews/services/portfolios viewable by all, editable by owners/creators

## Domain Layer

### Types Updated: `Provider.types.ts`
- **PriceRange**: Changed from {design?, construction?, subscription?} to {min, max, currency}
- **RatingsBreakdown**: Changed from {design, construction, service, communication, timeline, value} to {quality, communication, timeliness, value}
- All other types (ProviderProfile, ProviderReview, Portfolio, ProviderService) retained

## Infrastructure Layer

### Repository: `ProviderRepository.ts` (already exists)
- `getFullProfile(providerId)`: Calls `get_provider_full_profile` RPC
- `getReviews(providerId, limit, offset)`: Fetches provider_reviews with reviewer data
- `updateProfile(providerId, UpdateProviderProfileData)`: Updates app_users fields
- `uploadLogo(providerId, File)`: Uploads to Supabase Storage provider-assets bucket
- `uploadPortfolioImage(providerId, File)`: Uploads portfolio images
- `addService/removeService`: Manages provider_services
- `addPortfolio/removePortfolio`: Manages provider_portfolios
- `createReview(reviewerId, CreateReviewData)`: Inserts review (triggers rating recalculation)

### Mapper: `ProviderMapper.ts` (updated)
- **`toPriceRange`**: Now maps {min, max, currency} instead of string-based design/construction/subscription
- **`toRatingsBreakdown`**: Maps {quality, communication, timeliness, value} (4 dimensions instead of 6)
- Other mappers (toServices, toPortfolios, toSocialLinks, toProviderReview) unchanged

## Redux State

### Slice: `providerSlice.ts` (already exists)
- **Thunks**: fetchProviderProfile, fetchProviderReviews, updateProviderProfile, uploadProviderLogo, createProviderReview
- **State**: currentProfile, reviews, loading states
- Uses AsyncThunk with Result pattern for error handling

## UI Components

### New Components Created
1. **`ProviderHero.tsx`**: Hero section with gradient background, logo, company name, overall rating (stars + count), location (MapPin icon), bio
2. **`ProviderStats.tsx`**: 4-card grid (Projects Completed, Years Experience, Team Size, Founded) with icons and animations
3. **`ReviewCard.tsx`**: Review card with avatar, name, verified badge (CheckBadge), overall star rating, date, project type tag, review text, 4-dimensional ratings grid (quality/communication/timeliness/value)

### Updated Component
4. **`ProviderProfilePage.tsx`**: Fixed PriceRange display to show `{currency} {min} - {max}` instead of design/construction/subscription fields

### Existing Components (reused)
- `StatsGrid.tsx`, `ReviewList.tsx`, `ImageGallery.tsx`, `SocialLinks.tsx`

## i18n Translations

### Updated: `en.json`
- `provider.stats.experience`: "Years Experience"
- `provider.stats.years`: "years"
- `provider.pricing.range`: "Price Range"
- `provider.reviews.quality`: "Quality"
- `provider.reviews.communication`: "Communication"
- `provider.reviews.timeliness`: "Timeliness"
- `provider.reviews.value`: "Value"

### Required Additions (zh-TW, zh-CN)
- Same keys need to be added to Chinese translations

## Tech Stack
- **React 18.3** + **TypeScript 5.5** (strict mode)
- **RTK 2.9** (Redux Toolkit with AsyncThunk)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Framer Motion** (animations)
- **Heroicons** (UI icons)
- **i18n** (react-i18next)
- **Repository/Mapper Pattern** (Clean Architecture)

## Database Operations
```sql
-- Run migration
supabase db push

-- Or manually apply
psql -f supabase/migrations/20251006_provider_profile_schema.sql

-- Test RPC
SELECT * FROM get_provider_full_profile('provider-uuid');
SELECT * FROM calculate_provider_ratings('provider-uuid');
```

## Features Implemented
✅ Hero section with logo, company name, rating, location, bio
✅ Stats cards with projects/experience/team/founded
✅ Services tags display
✅ Price range (min-max-currency format)
✅ Social links integration
✅ Multi-dimensional reviews (quality, communication, timeliness, value)
✅ Portfolio gallery support (data layer ready)
✅ Auto-calculating ratings via trigger
✅ RLS policies for secure data access
✅ i18n support
✅ Mobbin black/gray theme
✅ Framer Motion animations
✅ Repository pattern with Result type
✅ Strict TypeScript

## Next Steps
1. Apply SQL migration to Supabase database
2. Add zh-TW/zh-CN translations
3. Create provider-assets storage bucket in Supabase
4. Test provider profile page at `/provider/:providerId`
5. Optionally add ImageGallery component implementation for portfolios
6. Consider adding review submission form UI

## File Manifest
- `supabase/migrations/20251006_provider_profile_schema.sql` (NEW)
- `src/features/provider/domain/Provider.types.ts` (UPDATED)
- `src/features/provider/infrastructure/ProviderMapper.ts` (UPDATED)
- `src/features/provider/infrastructure/ProviderRepository.ts` (EXISTING)
- `src/features/provider/store/providerSlice.ts` (EXISTING)
- `src/features/provider/components/ProviderHero.tsx` (NEW)
- `src/features/provider/components/ProviderStats.tsx` (NEW)
- `src/features/provider/components/ReviewCard.tsx` (NEW)
- `src/features/provider/components/ProviderProfilePage.tsx` (UPDATED - fixed PriceRange)
- `src/locales/en.json` (UPDATED)
- `supabase/migrations/20251006_create_app_users_upsert.sql` (previous task)

## Integration with Auth
- Uses `role` field from app_users (provider vs homeowner)
- RLS policies enforce provider_id = auth.uid() for edit operations
- Review creation requires authenticated user as reviewer_id
