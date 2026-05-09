import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

/**
 * LEMON SQUEEZY PROVIDER (REAL PAYMENT FLOW READY)
 * IMPORTANT:
 * - Lemon Squeezy uses hosted checkout URLs
 * - Frontend ONLY redirects user
 * - Supabase webhook is SOURCE OF TRUTH for subscription status
 */
export const lemonSqueezyProvider: BillingProvider = {
  name: "lemonsqueezy",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    try {
      // REAL IMPLEMENTATION FLOW:
      // const res = await fetch("/api/billing/lemonsqueezy/checkout", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ tier }),
      // });
      //
      // const data = await res.json();
      // if (!res.ok) throw new Error(data?.message || "Lemon Squeezy init failed");
      //
      // window.location.href = data.checkout_url;

      await new Promise((r) => setTimeout(r, 800));

      return {
        tier,
        isSubscribed: tier !== "free",
        provider: "lemonsqueezy",
        status: "pending",
        mockMode: true,
      };
    } catch {
      throw new Error("Lemon Squeezy subscription initialization failed");
    }
  },

  async cancel(): Promise<SubscriptionStatus> {
    try {
      // REAL FLOW:
      // await fetch("/api/billing/lemonsqueezy/cancel", { method: "POST" });

      await new Promise((r) => setTimeout(r, 500));

      return {
        tier: "free",
        isSubscribed: false,
        provider: "lemonsqueezy",
        status: "canceled",
        mockMode: true,
      };
    } catch {
      throw new Error("Lemon Squeezy cancellation failed");
    }
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // REAL SOURCE OF TRUTH = SUPABASE
      // const { data } = await supabase
      //   .from("profiles")
      //   .select("subscription_tier, subscription_status")
      //   .eq("id", userId)
      //   .single();

      return {
        tier: "free",
        isSubscribed: false,
        provider: "lemonsqueezy",
        status: "inactive",
        mockMode: true,
      };
    } catch {
      throw new Error("Failed to fetch Lemon Squeezy subscription status");
    }
  },
};
