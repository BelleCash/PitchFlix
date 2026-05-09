import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { UserProfile, UserRole, PayoutProvider } from "@/types";

interface OnboardingData {
  username: string;
  bio: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, role?: UserRole) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=7c3aed&backgroundType=solid`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // -----------------------------
  // PROFILE FETCH (SOURCE OF TRUTH = SUPABASE)
  // -----------------------------
  const fetchProfile = useCallback(async (u: User): Promise<UserProfile | null> => {
    const meta = u.user_metadata ?? {};

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", u.id)
      .single();

    if (error) {
      console.warn("Profile fetch warning:", error.message);
    }

    const username =
      data?.username ??
      meta.username ??
      u.email?.split("@")[0] ??
      "";

    return {
      id: u.id,
      email: u.email ?? "",
      role: (data?.role ?? meta.role ?? "viewer") as UserRole,
      subscriptionTier: (data?.subscription_tier ?? meta.subscription_tier ?? "free") as UserProfile["subscriptionTier"],
      isSubscribed: (data?.subscription_tier ?? "free") !== "free",
      username,
      bio: data?.bio ?? meta.bio ?? "",
      avatarUrl: data?.avatar_url ?? avatarUrl(username || u.id),
      onboardingComplete: data?.onboarding_complete ?? meta.onboarding_complete ?? false,
      walletConnected: data?.wallet_connected ?? false,
      payoutProvider: (data?.payout_provider ?? null) as PayoutProvider | null,
      payoutAccount: data?.payout_account ?? "",
      investorWalletBalance: data?.investor_wallet_balance ?? 0,
      creatorEarnings: data?.creator_earnings ?? 0,
    };
  }, []);

  const hydrateProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setUserProfile(null);
      return;
    }

    const profile = await fetchProfile(u);
    if (profile) setUserProfile(profile);
  }, [fetchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await hydrateProfile(user);
  }, [user, hydrateProfile]);

  // -----------------------------
  // INIT AUTH (FIXED RACE CONDITIONS)
  // -----------------------------
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await hydrateProfile(session.user);
      }

      setAuthLoading(false);
    };

    init();

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await hydrateProfile(session.user);
        } else {
          setUserProfile(null);
        }
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  // -----------------------------
  // AUTH METHODS
  // -----------------------------
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, role: UserRole = "viewer") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          subscription_tier: "free",
          onboarding_complete: false,
        },
      },
    });

    if (!error && data.user) {
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          role,
          subscription_tier: "free",
          onboarding_complete: false,
          avatar_url: avatarUrl(email.split("@")[0]),
        },
        { onConflict: "id" }
      );
    }

    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const updateRole = async (role: UserRole) => {
    if (!user) return;

    await supabase.auth.updateUser({
      data: { role },
    });

    await supabase.from("profiles").upsert(
      { id: user.id, role },
      { onConflict: "id" }
    );

    setUserProfile((prev) =>
      prev ? { ...prev, role } : prev
    );
  };

  const completeOnboarding = async ({ username, bio, role }: OnboardingData) => {
    if (!user) return;

    const avatar = avatarUrl(username || user.email?.split("@")[0] || user.id);

    await supabase.auth.updateUser({
      data: {
        username,
        bio,
        role,
        onboarding_complete: true,
      },
    });

    await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email,
        username,
        bio,
        role,
        avatar_url: avatar,
        onboarding_complete: true,
      },
      { onConflict: "id" }
    );

    setUserProfile((prev) =>
      prev
        ? { ...prev, username, bio, role, avatarUrl: avatar, onboardingComplete: true }
        : prev
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        authLoading,
        signIn,
        signUp,
        signOut,
        updateRole,
        completeOnboarding,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
