import type {
  BillingProvider,
  SubscriptionTier,
  SubscriptionStatus,
} from "@/types";

export const paystackProvider: BillingProvider = {
  name: "paystack",

  /**
   * ✅ Create Paystack checkout session ONLY
   */
  async subscribe(
    tier: SubscriptionTier
  ): Promise<{ checkoutUrl: string }> {
    const res = await fetch("/api/payments/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) {
      throw new Error("Paystack init failed");
    }

    const data = await res.json();

    const url = data?.authorization_url || data?.checkoutUrl;

    if (!url) {
      throw new Error("Invalid Paystack response (missing authorization_url)");
    }

    return {
      checkoutUrl: url,
    };
  },

  /**
   * ✅ Cancel subscription (backend handles truth)
   */
  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/paystack/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Paystack cancel failed");
    }

    return res.json();
  },

  /**
   * ⚠️ MUST come from backend (Supabase is source of truth)
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/billing/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Paystack status failed");
    }

    return res.json();
  },
};
