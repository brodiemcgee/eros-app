import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getCurrentUserProfile } from '../services/supabase';
import { ProfileWithPhotos } from '../types/database';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: ProfileWithPhotos | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileWithPhotos | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile();
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      setProfile(userProfile as ProfileWithPhotos);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  const signUp = async (email: string, password: string) => {
    console.log('[AuthContext] signUp called:', { email });
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
      });
      console.log('[AuthContext] signUp result:', {
        error: result.error?.message,
        userId: result.data?.user?.id
      });
      return { error: result.error };
    } catch (err) {
      console.error('[AuthContext] signUp exception:', err);
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called:', { email });
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log('[AuthContext] signIn result:', {
        error: result.error?.message,
        userId: result.data?.user?.id
      });
      return { error: result.error };
    } catch (err) {
      console.error('[AuthContext] signIn exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
