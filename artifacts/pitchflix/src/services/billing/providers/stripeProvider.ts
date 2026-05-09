// providers/stripeProvider.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

export const stripeProvider: BillingProvider = {
  name: "stripe",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) throw new Error("Stripe checkout failed");

    return res.json();
  },

  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) throw new Error("Stripe cancel failed");

    return res.json();
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/stripe/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Stripe status failed");

    return res.json();
  },
};
