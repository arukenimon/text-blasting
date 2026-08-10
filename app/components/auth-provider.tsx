"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type Session, type User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getProfileOption } from "../admin/settings/QueryOptions";

type GatewayProfile = {
  mode?: "local" | "cloud";
  local_server?: {
    local_address?: string;
    public_address?: string;
    username?: string;
    password?: string;
  } | null;
  cloud_server?: {
    server_address?: string;
    username?: string;
    password?: string;
  } | null;
  sim_slot?: number | string | null;
  webhook_token?: string | null;
  webhook_registrations?: Record<string, unknown> | null;
} | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True while the initial session is being resolved. */
  loading: boolean;
  signOut: () => Promise<void>;
  profile: GatewayProfile;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Resolve current session on mount.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((error) => {
        console.error("[auth] Failed to resolve session:", error);
      })
      .finally(() => {
        setLoading(false);
      });

    // Subscribe to future auth state changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: profile } = useQuery(getProfileOption()) as { data: GatewayProfile };


  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Returns the current auth context.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
