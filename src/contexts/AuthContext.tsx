import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  createLocalAccount,
  deleteLocalAccount,
  getCurrentUser,
  signInLocalAccount,
  signOutLocalAccount,
  type LocalUser,
} from "@/lib/localStore";
import { supabase } from "@/lib/supabase";

interface LocalSession {
  user: LocalUser | User;
  source: "local" | "supabase";
}

interface AuthContextValue {
  session: LocalSession | null;
  user: LocalUser | User | null;
  authSource: "local" | "supabase" | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setSession({ user, source: "local" });
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session?.user ? { user: data.session.user, source: "supabase" } : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      if (getCurrentUser()) return;
      setSession(supabaseSession?.user ? { user: supabaseSession.user, source: "supabase" } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const user = signInLocalAccount(email, password);
      await supabase.auth.signOut();
      setSession({ user, source: "local" });
      return;
    } catch {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        throw new Error(error?.message ?? "No account found with that email and password.");
      }

      signOutLocalAccount();
      setSession({ user: data.user, source: "supabase" });
    }
  };

  const createAccount = async (email: string, password: string) => {
    const user = createLocalAccount(email, password);
    await supabase.auth.signOut();
    setSession({ user, source: "local" });
  };

  const signOut = async () => {
    if (session?.source === "supabase") {
      await supabase.auth.signOut();
    }

    signOutLocalAccount();
    setSession(null);
  };

  const deleteAccount = async () => {
    if (!session?.user) return;

    if (session.source === "local") {
      deleteLocalAccount(session.user.id);
    } else {
      const { error: tripsError } = await supabase.from("trips").delete().eq("user_id", session.user.id);
      if (tripsError) throw tripsError;

      const { error: reportsError } = await supabase
        .from("condition_reports")
        .delete()
        .eq("user_id", session.user.id);
      if (reportsError) throw reportsError;

      await supabase.auth.signOut();
    }

    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        authSource: session?.source ?? null,
        loading,
        signIn,
        createAccount,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
