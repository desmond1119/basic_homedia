import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/core/infrastructure/supabase/client';
import { useAppDispatch } from '@/core/store/hooks';
import { setAuthUser, clearAuthUser } from '../store/authSlice';

export type AppRole = 'homeowner' | 'provider' | 'admin' | 'guest';

export interface AuthUser {
  id: string;
  email: string | null;
  username?: string | null;
  role?: AppRole;
  avatarUrl?: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setIsLoading(false);
        return;
      }

      if (data.session?.user) {
        const authUser = fromSupabaseUser(data.session.user);
        setUser(authUser);
        dispatch(setAuthUser(authUser));
      }
      setIsLoading(false);
    };

    void init();

    const { data: subscription } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        const authUser = fromSupabaseUser(session.user);
        setUser(authUser);
        dispatch(setAuthUser(authUser));
      } else {
        setUser(null);
        dispatch(clearAuthUser());
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error('No user data returned');
    
    const authUser = fromSupabaseUser(data.user);
    setUser(authUser);
    dispatch(setAuthUser(authUser));
    return authUser;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    dispatch(clearAuthUser());
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const fromSupabaseUser = (user: import('@supabase/supabase-js').User): AuthUser => {
  // Extract from metadata or generate defaults
  const emailPrefix = user.email?.split('@')[0] || '';
  const defaultUsername = emailPrefix || `user_${user.id.substring(0, 8)}`;
  
  return {
    id: user.id,
    email: user.email ?? null,
    username: user.user_metadata?.username ?? defaultUsername,
    role: (user.user_metadata?.role as AppRole | undefined) ?? 'homeowner',
    avatarUrl: user.user_metadata?.avatar_url ?? user.user_metadata?.avatarUrl ?? null,
  };
};
