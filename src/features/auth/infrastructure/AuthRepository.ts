/**
 * Auth Repository
 * Handles authentication operations with Supabase
 */

import { supabase } from '@/core/infrastructure/supabase/client';
import { Result } from '@/core/domain/base/Result';
import { AuthMapper } from './AuthMapper';
import { AuthSession, LoginCredentials, ProviderTypeOption, RegisterData } from '../domain/Auth.types';

const isDuplicateKeyError = (error: { code?: string } | null | undefined) =>
  error?.code === '23505';

const isRecursionError = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === 'P0001' || error?.message?.includes('infinite recursion');


export class AuthRepository {
  async register(data: RegisterData): Promise<Result<AuthSession, Error>> {
    try {
      // 1. Check username availability
      const { data: isAvailable, error: checkError } = await supabase
        .rpc('is_username_available', { check_username: data.username });

      if (checkError) {
        return Result.fail(new Error(`Username check failed: ${checkError.message}`));
      }

      if (!isAvailable) {
        return Result.fail(new Error('Username is already taken'));
      }

      // 2. Sign up with Supabase Auth (put all data in metadata for trigger)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            role: data.role,
            fullName: data.fullName,
            full_name: data.fullName,
            phone: data.phone,
            providerTypeId: data.providerTypeId,
          },
        },
      });

      if (signUpError) {
        return Result.fail(new Error(signUpError.message));
      }

      if (!authData.user) {
        return Result.fail(new Error('Registration failed: No user created'));
      }

      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          auth_id: authData.user.id,
          username: data.username,
          email: data.email,
          role: data.role,
          full_name: data.fullName ?? null,
          phone: data.phone ?? null,
          email_verified: authData.user.email_confirmed_at !== null,
        });

      if (insertError && insertError.code !== '23505') {
        return Result.fail(new Error(`Profile creation failed: ${insertError.message}`));
      }

      if (!authData.session) {
        return Result.fail(new Error('Please check your email to verify your account'));
      }

      const { data: profileData } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (!profileData) {
        return Result.fail(new Error('Failed to fetch user profile'));
      }

      const appUser = AuthMapper.toAppUser(profileData as any);
      const session = AuthMapper.toAuthSession(authData.session, appUser);

      return Result.ok(session);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown registration error')
      );
    }
  }

  async login(credentials: LoginCredentials): Promise<Result<AuthSession, Error>> {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (signInError) {
        return Result.fail(new Error(signInError.message));
      }

      if (!authData.user || !authData.session) {
        return Result.fail(new Error('Login failed: No session data'));
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      let profileData = null;
      
      const { data: appUserData } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', authData.user.id)
        .maybeSingle();

      if (appUserData) {
        profileData = appUserData;
      } else {
        const emailPrefix = authData.user.email?.split('@')[0] || '';
        const generatedUsername = emailPrefix.length >= 3 
          ? emailPrefix 
          : `user${authData.user.id.substring(0, 8)}`;

        const { error: createError } = await supabase
          .from('app_users')
          .insert({
            auth_id: authData.user.id,
            username: authData.user.user_metadata?.username || generatedUsername,
            email: authData.user.email || '',
            role: (authData.user.user_metadata?.role || 'homeowner') as 'admin' | 'provider' | 'homeowner',
            full_name: authData.user.user_metadata?.fullName || authData.user.user_metadata?.full_name,
            phone: authData.user.user_metadata?.phone,
            email_verified: authData.user.email_confirmed_at !== null,
          });

        if (createError && createError.code !== '23505') {
          return Result.fail(new Error(`Failed to create profile: ${createError.message}`));
        }

        const { data: retryData } = await supabase
          .from('app_users')
          .select('*')
          .eq('auth_id', authData.user.id)
          .maybeSingle();
        
        profileData = retryData;
      }

      if (!profileData) {
        return Result.fail(new Error('Failed to fetch user profile'));
      }

      if (!profileData.is_active) {
        await supabase.auth.signOut();
        return Result.fail(new Error('Account is deactivated'));
      }

      const appUser = AuthMapper.toAppUser(profileData as any);
      const session = AuthMapper.toAuthSession(authData.session, appUser);

      return Result.ok(session);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown login error')
      );
    }
  }

  async logout(): Promise<Result<boolean, Error>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return Result.fail(new Error(error.message));
      }

      return Result.ok(true);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown logout error')
      );
    }
  }

  async getCurrentSession(): Promise<Result<AuthSession | null, Error>> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        return Result.fail(new Error(sessionError.message));
      }

      if (!sessionData.session) {
        return Result.ok(null);
      }

      const { data: profileData } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_id', sessionData.session.user.id)
        .maybeSingle();

      if (!profileData) {
        return Result.ok(null);
      }

      const appUser = AuthMapper.toAppUser(profileData as any);
      const session = AuthMapper.toAuthSession(sessionData.session, appUser);

      return Result.ok(session);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error fetching session')
      );
    }
  }

  async getProviderTypes(): Promise<Result<ProviderTypeOption[], Error>> {
    try {
      const { data, error } = await supabase
        .from('provider_types')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) {
        return Result.fail(new Error(error.message));
      }

      const providerTypes = (data ?? []).map((row) => 
        AuthMapper.toProviderTypeOption(row as any)
      );
      return Result.ok(providerTypes);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error fetching provider types')
      );
    }
  }
}
