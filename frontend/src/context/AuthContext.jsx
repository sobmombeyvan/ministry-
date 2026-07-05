'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { fetchProfile, loginWithIdentifier, logout as authLogout, signUp as authSignUp } from '@/services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = getSupabase();
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          if (!cancelled) setUser(profile);
        } catch {
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (identifier, password) => {
    const profile = await loginWithIdentifier(identifier, password);
    setUser(profile);
    return profile;
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  const signup = async (fields) => {
    const result = await authSignUp(fields);
    if (result.profile) {
      setUser(result.profile);
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
