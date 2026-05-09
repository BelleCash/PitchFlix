import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

/**
 * PAYSTACK PROVIDER (REAL PAYMENT READY STRUCTURE)
 * IMPORTANT:
 * - Paystack MUST be handled via backend initialization
 * - Frontend only redirects to authorization_url
 * - Supabase is the ONLY source of truth after webhook
 */
export const paystackProvider: BillingProvider = {
  name: "paystack",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    try {
      // REAL FLOW (DO NOT SKIP THIS IN BACKEND IMPLEMENTATION):
      // const res = await fetch("/api/billing/paystack/initialize", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ tier }),
      // });
      //
      // const data = await res.json();
      // if (!res.ok) throw new Error(data?.message || "Paystack init failed");
      //
      // window.location.href = data.authorization_url;

      await new Promise((r) => setTimeout(r, 800));

      return {
        tier,
        isSubscribed: tier !== "free",
        provider: "paystack",
        status: "pending",
        mockMode: true,
      };
    } catch {
      throw new Error("Paystack subscription initialization failed");
    }
  },

  async cancel(): Promise<SubscriptionStatus> {
    try {
      // REAL FLOW:
      // await fetch("/api/billing/paystack/cancel", { method: "POST" });

      await new Promise((r) => setTimeout(r, 500));

      return {
        tier: "free",
        isSubscribed: false,
        provider: "paystack",
        status: "canceled",
        mockMode: true,
      };
    } catch {
      throw new Error("Paystack cancellation failed");
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
        provider: "paystack",
        status: "inactive",
        mockMode: true,
      };
    } catch {
      throw new Error("Failed to fetch Paystack subscription status");
    }
  },
};
