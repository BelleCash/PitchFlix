// providers/opayProvider.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

export const opayProvider: BillingProvider = {
  name: "opay",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/opay/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) throw new Error("OPay payment failed");

    return res.json();
  },

  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/opay/cancel", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("OPay cancel failed");

    return res.json();
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/opay/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("OPay status failed");

    return res.json();
  },
};
