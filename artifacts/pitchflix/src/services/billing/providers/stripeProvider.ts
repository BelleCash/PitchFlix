import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

/**
 * STRIPE PROVIDER (TEST MODE → READY FOR REAL STRIPE API UPGRADE)
 * IMPORTANT:
 * - This is currently mock-safe
 * - Replace subscribe() with Stripe Checkout Session (backend call)
 * - Supabase MUST handle final subscription state via webhook
 */
export const stripeProvider: BillingProvider = {
  name: "stripe",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    try {
      // 👉 REAL IMPLEMENTATION SHOULD CALL YOUR BACKEND:
      // const res = await fetch("/api/billing/stripe/checkout", { method: "POST", body: JSON.stringify({ tier }) });
      // const data = await res.json();
      // window.location.href = data.url;

      await new Promise((r) => setTimeout(r, 800));

      return {
        tier,
        isSubscribed: tier !== "free",
        provider: "stripe",
        status: "pending",
        mockMode: true,
      };
    } catch (error) {
      throw new Error("Stripe subscription failed to initialize");
    }
  },

  async cancel(): Promise<SubscriptionStatus> {
    try {
      // 👉 REAL: call backend to cancel Stripe subscription
      await new Promise((r) => setTimeout(r, 500));

      return {
        tier: "free",
        isSubscribed: false,
        provider: "stripe",
        status: "canceled",
        mockMode: true,
      };
    } catch {
      throw new Error("Stripe cancellation failed");
    }
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // 👉 REAL: should fetch from Supabase (NOT Stripe directly)
      // const { data } = await supabase.from("profiles").select("subscription_tier, subscription_status").eq("id", userId)

      return {
        tier: "free",
        isSubscribed: false,
        provider: "stripe",
        status: "inactive",
        mockMode: true,
      };
    } catch {
      throw new Error("Failed to fetch Stripe subscription status");
    }
  },
};
