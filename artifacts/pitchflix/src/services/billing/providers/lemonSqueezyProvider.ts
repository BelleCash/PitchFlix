// providers/lemonSqueezyProvider.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

export const lemonSqueezyProvider: BillingProvider = {
  name: "lemonsqueezy",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/lemonsqueezy/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) throw new Error("Lemon Squeezy checkout failed");

    return res.json();
  },

  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/lemonsqueezy/cancel", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Lemon Squeezy cancel failed");

    return res.json();
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/lemonsqueezy/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Lemon Squeezy status failed");

    return res.json();
  },
};
