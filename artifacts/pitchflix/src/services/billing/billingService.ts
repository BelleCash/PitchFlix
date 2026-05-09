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

/**
 * ✅ SUPABASE IS THE ONLY SOURCE OF TRUTH
 * No provider is allowed to return final subscription state.
 */
async function fetchSubscriptionStatusFromSupabase(): Promise<SubscriptionStatus> {
  const res = await fetch("/api/billing/status", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch subscription status from server");
  }

  return res.json();
}

export const billingService = {
  /**
   * 🚨 IMPORTANT FIX:
   * Providers ONLY create checkout sessions.
   * They DO NOT determine subscription state.
   */
  async subscribe(opts: {
    provider?: string;
    tier: SubscriptionTier;
  }): Promise<{ checkoutUrl: string }> {
    const provider = getProvider(opts.provider);

    // STEP 1: Create checkout session ONLY
    const checkout = await provider.subscribe(opts.tier);

    // Expect provider to return URL or session
    if (!checkout?.checkoutUrl && !checkout?.url) {
      throw new Error("Invalid checkout response from provider");
    }

    const url = checkout.checkoutUrl ?? checkout.url;

    // STEP 2: DO NOT update Supabase here
    // Payment confirmation happens via webhook ONLY

    return { checkoutUrl: url };
  },

  /**
   * Cancel subscription (real backend is source of truth)
   */
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

    if (!res.ok) {
      throw new Error("Failed to cancel subscription on server");
    }

    return fetchSubscriptionStatusFromSupabase();
  },

  /**
   * ALWAYS SERVER-SIDE TRUTH
   */
  async getStatus(): Promise<SubscriptionStatus> {
    return fetchSubscriptionStatusFromSupabase();
  },

  listProviders(): string[] {
    return Object.keys(PROVIDERS);
  },
};
