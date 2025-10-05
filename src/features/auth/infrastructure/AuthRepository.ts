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

      // 2. Sign up with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
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

      if (insertError && !isDuplicateKeyError(insertError)) {
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

      const appUser = AuthMapper.toAppUser(profileData);
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

      // 2. Check if user exists in app_users, create if not
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (!existingUser) {
        // User authenticated but not in app_users - create profile
        const emailPrefix = authData.user.email?.split('@')[0] || '';
        const generatedUsername = emailPrefix.length >= 3 
          ? emailPrefix 
          : `user${authData.user.id.substring(0, 8)}`;

        const { error: createError } = await supabase
          .from('app_users')
          .upsert(
            {
              id: authData.user.id,
              username: generatedUsername,
              email: authData.user.email || '',
              role: 'homeowner',
            },
            { onConflict: 'id', ignoreDuplicates: false }
          );

        if (createError && !isDuplicateKeyError(createError)) {
          return Result.fail(new Error(`Failed to create user profile: ${createError.message}`));
        }
      }

      // 3. Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError || !profileData || !profileData.id) {
        return Result.fail(new Error(`Failed to fetch user profile: ${profileError?.message || 'No data'}`));
      }

      // 4. Check if user is active
      if (!profileData.is_active) {
        await supabase.auth.signOut();
        return Result.fail(new Error('Account is deactivated'));
      }

      const appUser = AuthMapper.toAppUser(profileData);
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

      const appUser = AuthMapper.toAppUser(profileData);
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

      const providerTypes = (data ?? []).map(AuthMapper.toProviderTypeOption);
      return Result.ok(providerTypes);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Unknown error fetching provider types')
      );
    }
  }
}
