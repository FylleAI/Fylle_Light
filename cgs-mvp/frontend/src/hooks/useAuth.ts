import { useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import posthog from "posthog-js";
import { supabase } from "@/lib/supabase";
import { apiRequest } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function useAuth() {
  const [, navigate] = useLocation();
  const { user, setUser, setContextId, setAuthReady, reset } = useAppStore();

  // Check active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name,
          });

          // Identify returning user in PostHog
          posthog.identify(session.user.id, {
            email: session.user.email,
            name: session.user.user_metadata?.full_name,
          });

          // Load profile to get contextId
          try {
            const profile = await apiRequest<{
              id: string;
              context_id?: string;
              full_name?: string;
            }>("/api/v1/users/profile");
            if (profile.full_name) {
              setUser({
                id: session.user.id,
                email: session.user.email || "",
                full_name: profile.full_name,
              });
            }
          } catch {
            // Profile might not exist yet
          }

          // Check if user has a context
          try {
            const contexts = await apiRequest<{ id: string }[]>(
              "/api/v1/contexts"
            );
            if (contexts.length > 0) {
              setContextId(contexts[0].id);
            }
          } catch {
            // No contexts yet
          }
        }
      } finally {
        setAuthReady(true);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name,
        });
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setContextId, reset]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      setUser({
        id: data.user.id,
        email: data.user.email || "",
        full_name: data.user.user_metadata?.full_name,
      });

      // Identify user in PostHog
      posthog.identify(data.user.id, {
        email: data.user.email,
        name: data.user.user_metadata?.full_name,
      });

      // Check contexts
      try {
        const contexts = await apiRequest<{ id: string }[]>("/api/v1/contexts");
        if (contexts.length > 0) {
          setContextId(contexts[0].id);
          navigate("/design-lab");
        } else {
          navigate("/onboarding");
        }
      } catch {
        navigate("/onboarding");
      }
    },
    [setUser, setContextId, navigate]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
        });
        navigate("/onboarding");
      }
    },
    [setUser, navigate]
  );

  const logout = useCallback(async () => {
    posthog.reset();
    await supabase.auth.signOut();
    reset();
    navigate("/login");
  }, [reset, navigate]);

  return {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
