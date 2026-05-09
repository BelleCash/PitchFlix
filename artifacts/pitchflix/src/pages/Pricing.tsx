import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import PricingCard from "@/components/billing/PricingCard";
import { useAuth } from "@/context/AuthContext";
import type { SubscriptionTier } from "@/types";

type PaymentProvider =
  | "stripe"
  | "paystack"
  | "lemonsqueezy"
  | "opay"
  | "moniepoint";

const PLANS: {
  tier: SubscriptionTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  recommended?: boolean;
}[] = [
  {
    tier: "free",
    name: "Free",
    price: 0,
    description: "Start exploring the marketplace.",
    features: ["Browse all pitches", "Like pitches", "Public profiles", "Tag search"],
  },
  {
    tier: "starter",
    name: "Starter",
    price: 9,
    description: "For creators ready to pitch.",
    features: [
      "Creator profile",
      "Upload pitches",
      "AI pitch scoring",
      "Basic analytics",
      "Genre filtering",
      "Payout account setup",
    ],
  },
  {
    tier: "pro",
    name: "Pro Investor",
    price: 19,
    description: "Find and fund the next big film.",
    recommended: true,
    features: [
      "Investor dashboard",
      "Deal flow feed",
      "Watchlists",
      "Investor voting",
      "AI deal scoring",
      "Trending alerts",
      "Capital wallet",
      "Investor comments",
    ],
  },
  {
    tier: "studio",
    name: "Studio",
    price: 49,
    description: "Full-platform power for studios and teams.",
    features: [
      "Everything in Pro",
      "Unlimited pitch uploads",
      "Advanced analytics",
      "Featured placement",
      "Team access",
      "Priority support",
      "Early deal access",
    ],
  },
];

const PAYMENT_PROVIDERS: { id: PaymentProvider; label: string }[] = [
  { id: "stripe", label: "Stripe (Test Mode)" },
  { id: "paystack", label: "Paystack (NGN)" },
  { id: "lemonsqueezy", label: "Lemon Squeezy" },
  { id: "opay", label: "OPay (Mobile Money)" },
  { id: "moniepoint", label: "Moniepoint" },
];

export default function Pricing() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");

  /**
   * REAL PAYMENT FLOW:
   * - Calls backend API
   * - Backend creates checkout session for provider
   * - Redirect user
   */
  const handleSelect = async (tier: SubscriptionTier) => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/");
      return;
    }

    if (tier === "free") {
      toast.success("You are already on Free plan");
      return;
    }

    setLoading(tier);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          provider,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Payment initialization failed");
      }

      /**
       * Expected backend response:
       * {
       *   url: "https://checkout.stripe.com/...",
       * }
       */
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No checkout URL returned");
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ background: "#0b0b0f", minHeight: "100vh", paddingBottom: 100 }}>
      {/* NAV */}
      <nav className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center", height: 66 }}>
          <a href="/" style={{ display: "flex", gap: 10, textDecoration: "none", alignItems: "center" }}>
            <div style={{ width: 33, height: 33, background: "#7c3aed", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>🎬</div>
            <span style={{ fontWeight: 900, color: "#fff" }}>
              Pitch<span style={{ color: "#8b5cf6" }}>Flix</span>
            </span>
          </a>

          <a href="/" style={{ color: "#9ca3af", textDecoration: "none" }}>← Back</a>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "70px 28px 0" }}>
        <h1 style={{ fontSize: 40, fontWeight: 900, textAlign: "center" }}>
          Choose Your <span style={{ color: "#8b5cf6" }}>Plan</span>
        </h1>

        <p style={{ textAlign: "center", color: "#9ca3af", marginTop: 10 }}>
          Payments powered by real providers — secured & webhook-based via Supabase
        </p>

        {/* PAYMENT PROVIDER SELECTOR */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 25, flexWrap: "wrap", gap: 10 }}>
          {PAYMENT_PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.1)",
                background: provider === p.id ? "#7c3aed" : "rgba(255,255,255,0.05)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* PLANS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 20,
            marginTop: 40,
          }}
        >
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.tier}
              {...plan}
              current={false}
              loading={loading === plan.tier}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* NOTE */}
        <div style={{ marginTop: 60, textAlign: "center", color: "#6b7280", fontSize: 13 }}>
          ⚡ All subscriptions are verified via Supabase webhooks (not frontend state)
        </div>
      </div>
    </div>
  );
}
