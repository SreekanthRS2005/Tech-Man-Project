import { createContext, useEffect, useState, ReactNode } from 'react';
import supabase from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '../hooks/useToast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If session is null, clear any stale session data to prevent refresh token errors
      if (!session) {
        await supabase.auth.signOut();
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Set up session expiry check (check every minute)
    const sessionCheckInterval = setInterval(() => {
      if (session && session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        
        // If session expires in less than 5 minutes, show warning
        if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
          showToast('Your session will expire soon. Please save your work and refresh.', 'warning');
        }
        
        // If session has expired, sign out
        if (expiresAt < now) {
          signOut();
          showToast('Your session has expired. Please sign in again.', 'error');
        }
      }
    }, 60000);

    return () => {
      subscription?.unsubscribe();
      clearInterval(sessionCheckInterval);
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // If rememberMe is true, persist the session for 30 days
          // Otherwise, use the default session duration
          expiresIn: rememberMe ? 30 * 24 * 60 * 60 : undefined
        }
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) throw error;
      
      // Create a user profile in the users table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            full_name: fullName,
          });
          
        if (profileError) throw profileError;
        
        // Assign default user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: 'user'
          });
          
        if (roleError) throw roleError;
      }
      
      return { error: null, data };
    } catch (error) {
      return { error, data: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};