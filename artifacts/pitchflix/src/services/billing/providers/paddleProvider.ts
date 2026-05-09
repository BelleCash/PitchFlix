// providers/paddleProvider.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

export const paddleProvider: BillingProvider = {
  name: "paddle",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/paddle/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) throw new Error("Paddle checkout failed");

    return res.json();
  },

  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/paddle/cancel", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Paddle cancel failed");

    return res.json();
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/paddle/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Paddle status failed");

    return res.json();
  },
};
