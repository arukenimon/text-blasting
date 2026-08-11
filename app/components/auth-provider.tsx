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
import {
  getWorkspaceContextOption,
  type WorkspaceOption,
  type WorkspaceRole,
} from "../admin/workspaces/QueryOptions";

type ProfileContext = {
  active_workspace_id?: string | null;
} | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True while the initial session is being resolved. */
  loading: boolean;
  signOut: () => Promise<void>;
  profile: ProfileContext;
  workspaces: WorkspaceOption[];
  activeWorkspace: WorkspaceOption | null;
  activeRole: WorkspaceRole | null;
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

  const { data: workspaceContext } = useQuery(getWorkspaceContextOption(user?.id));


  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await router.refresh();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: workspaceContext?.profile ?? null,
        workspaces: workspaceContext?.workspaces ?? [],
        activeWorkspace: workspaceContext?.activeWorkspace ?? null,
        activeRole: workspaceContext?.activeRole ?? null,
        session,
        loading,
        signOut,
      }}
    >
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
