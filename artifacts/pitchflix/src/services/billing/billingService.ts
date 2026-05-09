// billingService.ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";

import { stripeProvider } from "./providers/stripeProvider";
import { paystackProvider } from "./providers/paystackProvider";
import { lemonSqueezyProvider } from "./providers/lemonSqueezyProvider";
import { paddleProvider } from "./providers/paddleProvider";
import { moniepointProvider } from "./providers/moniepointProvider";
import { opayProvider } from "./providers/opayProvider";

const PROVIDERS: Record<string, BillingProvider> = {
  stripe: stripeProvider,
  paystack: paystackProvider,
  lemonsqueezy: lemonSqueezyProvider,
  paddle: paddleProvider,
  moniepoint: moniepointProvider,
  opay: opayProvider,
};

const DEFAULT_PROVIDER = "stripe";

function getProvider(name?: string): BillingProvider {
  return PROVIDERS[name ?? DEFAULT_PROVIDER] ?? stripeProvider;
}

// Supabase is source of truth (ALL status writes/reads go through backend)
async function fetchSubscriptionStatusFromSupabase(): Promise<SubscriptionStatus> {
  const res = await fetch("/api/billing/status", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch subscription status");
  return res.json();
}

export const billingService = {
  async subscribe(opts: { provider?: string; tier: SubscriptionTier }): Promise<SubscriptionStatus> {
    const provider = getProvider(opts.provider);

    const result = await provider.subscribe(opts.tier);

    // persist to Supabase (source of truth)
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tier: opts.tier,
        provider: provider.name,
      }),
    });

    if (!res.ok) throw new Error("Failed to persist subscription");

    return fetchSubscriptionStatusFromSupabase();
  },

  async cancel(opts?: { provider?: string }): Promise<SubscriptionStatus> {
    const provider = getProvider(opts?.provider);

    await provider.cancel();

    const res = await fetch("/api/billing/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        provider: provider.name,
      }),
    });

    if (!res.ok) throw new Error("Failed to cancel subscription");

    return fetchSubscriptionStatusFromSupabase();
  },

  async getStatus(opts?: { provider?: string }): Promise<SubscriptionStatus> {
    // ALWAYS Supabase-backed truth
    return fetchSubscriptionStatusFromSupabase();
  },

  listProviders(): string[] {
    return Object.keys(PROVIDERS);
  },
};
