/**
 * Auth Domain Types
 * Type definitions for authentication domain
 */

export type UserRole = 'homeowner' | 'provider' | 'admin';

export type ProviderType = 'interior_design' | 'renovation' | 'cleaning';

export interface ProviderTypeOption {
  id: string;
  typeName: string;
  displayName: string;
  description: string | null;
  isActive: boolean;
}

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  providerType: string | null;
  providerTypeDisplay: string | null;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  providerTypeId?: string | undefined;
  fullName?: string | undefined;
  phone?: string | undefined;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: AppUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface RegisterError {
  field: 'username' | 'email' | 'password' | 'general';
  message: string;
}
