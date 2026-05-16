// providers/moniepointProvider.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

export const moniepointProvider: BillingProvider = {
  name: "moniepoint",

  async subscribe(tier: SubscriptionTier): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/moniepoint/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tier }),
    });

    if (!res.ok) throw new Error("Moniepoint payment failed");

    return res.json();
  },

  async cancel(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/moniepoint/cancel", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Moniepoint cancel failed");

    return res.json();
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/payments/moniepoint/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) throw new Error("Moniepoint status failed");

    return res.json();
  },
};
