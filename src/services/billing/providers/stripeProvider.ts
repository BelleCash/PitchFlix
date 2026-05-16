import type {
  BillingProvider,
  SubscriptionTier,
  SubscriptionStatus,
} from "@/types";

export const stripeProvider: BillingProvider = {
  name: "stripe",

  /**
   * ✅ ONLY creates checkout session
   */
  async subscribe(
    tier: SubscriptionTier
  ): Promise<{ checkoutUrl: string }> {
    const res = await fetch("/api/payments/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) {
      throw new Error("Stripe checkout failed");
    }

    const data = await res.json();

    if (!data?.checkoutUrl) {
      throw new Error("Invalid Stripe checkout response");
    }

    return {
      checkoutUrl: data.checkoutUrl,
    };
  },

  /**
   * ✅ cancel subscription (delegates to backend)
   */
  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Stripe cancel failed");
    }

    return res.json();
  },

  /**
   * ⚠️ Status MUST come from backend (source of truth)
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/billing/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Stripe status failed");
    }

    return res.json();
  },
};
