import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBilling } from "@/context/BillingContext";
import { supabase } from "@/lib/supabase";
import type { PayoutProvider } from "@/types";

const PAYOUT_PROVIDERS: {
  id: PayoutProvider;
  label: string;
  icon: string;
  desc: string;
}[] = [
  { id: "stripe", label: "Stripe", icon: "💳", desc: "International cards & bank transfers" },
  { id: "paystack", label: "Paystack", icon: "🟢", desc: "Africa-first payment infrastructure" },
  { id: "lemon_squeezy", label: "Lemon Squeezy", icon: "🍋", desc: "Merchant of record, zero setup" },
  { id: "opay", label: "OPay", icon: "🅾️", desc: "Mobile money & instant transfers" },
  { id: "moniepoint", label: "Moniepoint", icon: "🏦", desc: "Business banking & POS payouts" },
  { id: "bank_account", label: "Bank Account", icon: "🏛️", desc: "Direct bank wire transfer" },
  { id: "metamask", label: "MetaMask", icon: "🦊", desc: "Web3 wallet (coming soon)" },
];

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=7c3aed&backgroundType=solid`;
}

export default function Settings() {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const { tier, isSubscribed } = useBilling();
  const [, navigate] = useLocation();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  const [selectedProvider, setSelectedProvider] =
    useState<PayoutProvider | null>(null);

  const [payoutAccount, setPayoutAccount] = useState("");
  const [walletConnected, setWalletConnected] = useState(false);

  const [saving, setSaving] = useState(false);
  const [walletSaving, setWalletSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // -----------------------------
  // SAFE SYNC (FIXED DEPENDENCY BUG)
  // -----------------------------
  useEffect(() => {
    if (!userProfile) return;

    setUsername(userProfile.username ?? "");
    setBio(userProfile.bio ?? "");
    setSelectedProvider(userProfile.payoutProvider ?? null);
    setPayoutAccount(userProfile.payoutAccount ?? "");
    setWalletConnected(userProfile.walletConnected ?? false);
  }, [userProfile?.id]);

  // -----------------------------
  // SAFE NAVIGATION (FIXED RENDER BUG)
  // -----------------------------
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  if (!user) return null;

  const role = userProfile?.role ?? "viewer";
  const isInvestor = role === "investor";

  const displayName =
    userProfile?.username || user.email?.split("@")[0] || "User";

  const avatar = userProfile?.avatarUrl ?? avatarUrl(displayName);

  // -----------------------------
  // PROFILE SAVE (FIXED SUPABASE SYNC)
  // -----------------------------
  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    setSaving(true);

    try {
      const newAvatar = avatarUrl(username.trim());

      if (supabase) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            username: username.trim(),
            bio: bio.trim(),
            avatar_url: newAvatar,
          },
          { onConflict: "id" }
        );

        await supabase.auth.updateUser({
          data: {
            username: username.trim(),
            bio: bio.trim(),
          },
        });
      }

      await refreshProfile();
      toast.success("Profile saved!");
    } catch (err) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------
  // WALLET SAVE (FIXED CONSISTENCY)
  // -----------------------------
  const handleSaveWallet = async () => {
    if (!selectedProvider) {
      toast.error("Select a provider first");
      return;
    }

    if (!payoutAccount.trim()) {
      toast.error("Enter account details");
      return;
    }

    setWalletSaving(true);

    try {
      if (supabase) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            payout_provider: selectedProvider,
            payout_account: payoutAccount.trim(),
            wallet_connected: true,
          },
          { onConflict: "id" }
        );
      }

      setWalletConnected(true);
      await refreshProfile();
      toast.success("Payout method connected!");
    } catch {
      toast.error("Failed to save wallet");
    } finally {
      setWalletSaving(false);
    }
  };

  // -----------------------------
  // INVESTOR WALLET
  // -----------------------------
  const handleConnectInvestorWallet = async () => {
    setWalletSaving(true);

    try {
      if (supabase) {
        await supabase.from("profiles").upsert(
          {
            id: user.id,
            wallet_connected: true,
          },
          { onConflict: "id" }
        );
      }

      setWalletConnected(true);
      await refreshProfile();
      toast.success("Capital wallet activated!");
    } catch {
      toast.error("Failed to connect wallet");
    } finally {
      setWalletSaving(false);
    }
  };

  // -----------------------------
  // SIGN OUT
  // -----------------------------
  const handleDeleteAccount = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);

    try {
      await signOut();
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
      setDeleting(false);
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={{ background: "#0b0b0f", minHeight: "100vh", paddingBottom: 80 }}>
      <nav className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 66,
          }}
        >
          <a href="/" style={{ textDecoration: "none", color: "#fff" }}>
            🎬 PitchFlix
          </a>

          <a
            href={isInvestor ? "/investor" : "/dashboard"}
            style={{ color: "#9ca3af", fontSize: 13, textDecoration: "none" }}
          >
            ← Dashboard
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Settings</h1>
        <p style={{ color: "#6b7280", fontSize: 14 }}>
          Manage your account
        </p>

        {/* PROFILE */}
        <section style={{ marginTop: 30 }}>
          <h2>Profile</h2>

          <input
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.replace(/\s/g, "").toLowerCase())
            }
            placeholder="username"
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="bio"
          />

          <button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </section>

        {/* WALLET */}
        {!isInvestor && (
          <section style={{ marginTop: 40 }}>
            <h2>Payout</h2>

            <button onClick={handleSaveWallet} disabled={walletSaving}>
              {walletSaving ? "Saving..." : "Save Wallet"}
            </button>
          </section>
        )}

        {/* INVESTOR */}
        {isInvestor && (
          <section style={{ marginTop: 40 }}>
            <h2>Investor Wallet</h2>

            <button onClick={handleConnectInvestorWallet} disabled={walletSaving}>
              Connect Wallet
            </button>
          </section>
        )}

        {/* DELETE */}
        <section style={{ marginTop: 40 }}>
          <button onClick={handleDeleteAccount} disabled={deleting}>
            {confirmDelete ? "Confirm Delete" : "Sign Out"}
          </button>
        </section>
      </div>
    </div>
  );
}
