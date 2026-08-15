// Thin wrapper around supabase.auth to provide a consistent auth API
// that mirrors the shape of what the codebase previously got from useAuth0.
//
// Usage:
//   const { session, user, isAuthenticated, isLoading, signOut } = useSession();

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const missingSupabase = () => Promise.reject(new Error('Supabase is not configured'));

export function useSession() {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      setIsLoading(false);
      return undefined;
    }

    // Read the current session immediately (synchronous from cache)
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setIsLoading(false);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => supabase?.auth.signOut() ?? missingSupabase();

  const signInWithGoogle = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    }) ?? missingSupabase();

  const signInWithGitHub = () =>
    supabase?.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/` },
    }) ?? missingSupabase();

  const signInWithEmail = (email, password) =>
    supabase?.auth.signInWithPassword({ email, password }) ?? missingSupabase();

  const signUpWithEmail = (email, password) =>
    supabase?.auth.signUp({ email, password }) ?? missingSupabase();

  const signInWithMagicLink = (email) =>
    supabase?.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    }) ?? missingSupabase();

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    isLoading,
    signOut,
    signInWithGoogle,
    signInWithGitHub,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
  };
}
