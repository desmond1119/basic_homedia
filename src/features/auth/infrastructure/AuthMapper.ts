/**
 * Auth Mapper
 * Maps between Supabase auth models and domain models
 */

import { Session } from '@supabase/supabase-js';
import { AppUser, AuthSession, ProviderTypeOption } from '../domain/Auth.types';

interface UserProfileRow {
  id: string;
  username: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  provider_type: string | null;
  provider_type_display: string | null;
}

interface ProviderTypeRow {
  id: string;
  type_name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
}

export class AuthMapper {
  static toAppUser(profile: UserProfileRow): AppUser {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      role: profile.role as AppUser['role'],
      providerType: profile.provider_type,
      providerTypeDisplay: profile.provider_type_display,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_url,
      isActive: profile.is_active,
      emailVerified: profile.email_verified,
      createdAt: new Date(profile.created_at),
    };
  }

  static toAuthSession(session: Session, appUser: AppUser): AuthSession {
    return {
      user: appUser,
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: session.expires_at ?? 0,
    };
  }

  static toProviderTypeOption(row: ProviderTypeRow): ProviderTypeOption {
    return {
      id: row.id,
      typeName: row.type_name,
      displayName: row.display_name,
      description: row.description,
      isActive: row.is_active,
    };
  }
}
