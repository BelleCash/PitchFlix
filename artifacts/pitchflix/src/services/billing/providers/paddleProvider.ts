import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

/**
 * PADDLE PROVIDER (REAL PAYMENT STRUCTURE READY)
 * NOTE:
 * - Paddle uses checkout overlay or hosted checkout URL
 * - Frontend MUST NOT finalize subscription state
 * - Supabase webhook is source of truth
 */
export const paddleProvider: BillingProvider = {
  name: "paddle",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    try {
      // REAL IMPLEMENTATION FLOW:
      // const res = await fetch("/api/billing/paddle/checkout", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ tier }),
      // });
      //
      // const data = await res.json();
      // if (!res.ok) throw new Error(data?.message || "Paddle init failed");
      //
      // window.location.href = data.checkout_url;

      await new Promise((r) => setTimeout(r, 800));

      return {
        tier,
        isSubscribed: tier !== "free",
        provider: "paddle",
        status: "pending",
        mockMode: true,
      };
    } catch {
      throw new Error("Paddle subscription initialization failed");
    }
  },

  async cancel(): Promise<SubscriptionStatus> {
    try {
      // REAL FLOW:
      // await fetch("/api/billing/paddle/cancel", { method: "POST" });

      await new Promise((r) => setTimeout(r, 500));

      return {
        tier: "free",
        isSubscribed: false,
        provider: "paddle",
        status: "canceled",
        mockMode: true,
      };
    } catch {
      throw new Error("Paddle cancellation failed");
    }
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      // REAL SOURCE OF TRUTH: SUPABASE
      // const { data } = await supabase
      //   .from("profiles")
      //   .select("subscription_tier, subscription_status")
      //   .eq("id", userId)
      //   .single();

      return {
        tier: "free",
        isSubscribed: false,
        provider: "paddle",
        status: "inactive",
        mockMode: true,
      };
    } catch {
      throw new Error("Failed to fetch Paddle subscription status");
    }
  },
};
