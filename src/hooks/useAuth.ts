import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

async function fetchIsAdmin(userId: string): Promise<boolean> {
  // Race the DB query against a 5-second timeout so loading never hangs forever
  const timeoutPromise = new Promise<boolean>((resolve) =>
    setTimeout(() => resolve(false), 5000)
  );

  const queryPromise = (async () => {
    // The profiles table has NO role column — only user_roles has role data
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[useAuth] user_roles query error:", error.message);
      return false;
    }
    return data?.role === "admin";
  })();

  return Promise.race([queryPromise, timeoutPromise]);
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false;

    // Initial session load — this is the authoritative source of truth for loading state
    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          console.error("[useAuth] getSession error:", error.message);
          return;
        }
        try {
          if (mounted) setSession(data.session);
          if (data.session?.user) {
            const adminStatus = await fetchIsAdmin(data.session.user.id);
            if (mounted) setIsAdmin(adminStatus);
          }
        } catch (err) {
          console.error("[useAuth] fetchIsAdmin error:", err);
        } finally {
          initialLoadDone = true;
          if (mounted) setLoading(false);
        }
      })
      .catch((err) => {
        console.error("[useAuth] Unexpected session error:", err);
        initialLoadDone = true;
        if (mounted) setLoading(false);
      });

    // Auth state changes (login, logout, token refresh)
    // Do NOT toggle loading=true here — it would re-block the UI on every token refresh
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      // During the initial load window, skip duplicate INITIAL_SESSION events
      // only if there is no session (getSession already handles the no-session case)
      if (!initialLoadDone && !s) return;

      try {
        if (mounted) setSession(s);
        if (s?.user) {
          const adminStatus = await fetchIsAdmin(s.user.id);
          if (mounted) setIsAdmin(adminStatus);
        } else {
          if (mounted) setIsAdmin(false);
        }
      } catch (err) {
        console.error("[useAuth] onAuthStateChange error:", err);
      }
      // Intentionally NOT managing loading here — only getSession() controls loading
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, isAdmin, loading };
}
