import type {
  BillingProvider,
  SubscriptionTier,
  SubscriptionStatus,
} from "@/types";

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

export const billingService = {
  /**
   * ✅ CREATE CHECKOUT ONLY (NO STATE CHANGES HERE)
   */
  async subscribe(opts: {
    provider?: string;
    tier: SubscriptionTier;
  }): Promise<{ checkoutUrl: string }> {
    const provider = getProvider(opts.provider);

    const checkout = await provider.subscribe(opts.tier);

    if (!checkout) {
      throw new Error("Provider did not return checkout session");
    }

    const url = checkout.checkoutUrl || checkout.url;

    if (!url) {
      throw new Error("Invalid checkout URL from provider");
    }

    return { checkoutUrl: url };
  },

  /**
   * ✅ CANCEL SUBSCRIPTION (SERVER IS SOURCE OF TRUTH)
   */
  async cancel(opts?: { provider?: string }): Promise<SubscriptionStatus> {
    const provider = getProvider(opts?.provider);

    // 1. cancel at provider level
    await provider.cancel();

    // 2. notify backend ONLY (no duplication of logic)
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

    // 3. always fetch fresh truth from backend
    return this.getStatus();
  },

  /**
   * ✅ SINGLE SOURCE OF TRUTH = BACKEND ONLY
   * (no frontend assumptions)
   */
  async getStatus(): Promise<SubscriptionStatus> {
    const res = await fetch("/api/billing/status", {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch subscription status");
    }

    return res.json();
  },

  listProviders(): string[] {
    return Object.keys(PROVIDERS);
  },
};
