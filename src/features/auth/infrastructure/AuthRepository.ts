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

const isProfileExistsError = (error: { code?: string; message?: string } | null | undefined) =>
  isDuplicateKeyError(error) || isRecursionError(error);

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

      // 3. Insert into app_users table
      const { error: insertError } = await supabase
        .from('app_users')
        .upsert(
          {
            id: authData.user.id,
            username: data.username,
            email: data.email,
            role: data.role,
            provider_type_id: data.providerTypeId ?? null,
            full_name: data.fullName ?? null,
            phone: data.phone ?? null,
          },
          { onConflict: 'id', ignoreDuplicates: false }
        );

      if (insertError && !isProfileExistsError(insertError)) {
        return Result.fail(new Error(`Profile creation failed: ${insertError.message}`));
      }

      // 4. Handle email confirmation scenario
      if (!authData.session) {
        return Result.fail(new Error('Please check your email to verify your account'));
      }

      // 5. Fetch complete user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profileData || !profileData.id) {
        return Result.fail(new Error('Failed to fetch user profile'));
      }

      const appUser = AuthMapper.toAppUser(profileData as Parameters<typeof AuthMapper.toAppUser>[0]);
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
      // 1. Sign in with Supabase Auth
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

      // 2. Wait a bit for trigger to complete (if just registered)
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Fetch user profile with retry
      let profileData = null;
      let profileError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        profileData = result.data;
        profileError = result.error;
        
        if (profileData && profileData.id) break;
        
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // 4. If still no profile, try to create it manually
      if (!profileData || !profileData.id) {
        const emailPrefix = authData.user.email?.split('@')[0] || '';
        const generatedUsername = emailPrefix.length >= 3 
          ? emailPrefix 
          : `user${authData.user.id.substring(0, 8)}`;

        const { error: createError } = await supabase
          .from('app_users')
          .upsert(
            {
              id: authData.user.id,
              username: authData.user.user_metadata?.username || generatedUsername,
              email: authData.user.email || '',
              role: (authData.user.user_metadata?.role || 'homeowner') as 'admin' | 'provider' | 'homeowner',
              full_name: authData.user.user_metadata?.fullName || authData.user.user_metadata?.full_name,
              phone: authData.user.user_metadata?.phone,
            },
            { onConflict: 'id', ignoreDuplicates: false }
          );

        if (createError && !isProfileExistsError(createError)) {
          return Result.fail(new Error(`Failed to create user profile: ${createError.message}`));
        }

        // Retry fetch after manual creation
        const retryResult = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();
        
        profileData = retryResult.data;
        profileError = retryResult.error;
      }

      if (profileError || !profileData || !profileData.id) {
        return Result.fail(new Error(`Failed to fetch user profile: ${profileError?.message || 'No data'}`));
      }

      // 4. Check if user is active
      if (!profileData.is_active) {
        await supabase.auth.signOut();
        return Result.fail(new Error('Account is deactivated'));
      }

      const appUser = AuthMapper.toAppUser(profileData as Parameters<typeof AuthMapper.toAppUser>[0]);
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

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();

      if (profileError || !profileData || !profileData.id) {
        return Result.ok(null);
      }

      const appUser = AuthMapper.toAppUser(profileData as Parameters<typeof AuthMapper.toAppUser>[0]);
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
        AuthMapper.toProviderTypeOption(row as Parameters<typeof AuthMapper.toProviderTypeOption>[0])
      );
      return Result.ok(providerTypes);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error fetching provider types')
      );
    }
  }
}
