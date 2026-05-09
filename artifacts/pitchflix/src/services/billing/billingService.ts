```ts
import type { BillingProvider, SubscriptionTier, SubscriptionStatus } from "@/types";
import { stripeProvider } from "./providers/stripeProvider";
import { paystackProvider } from "./providers/paystackProvider";
import { lemonSqueezyProvider } from "./providers/lemonSqueezyProvider";
import { paddleProvider } from "./providers/paddleProvider";

/**
 * Centralized billing providers registry
 * NOTE: Supabase remains source of truth for subscription state
 * Providers ONLY handle payment + webhook initiation
 */
const PROVIDERS: Record<string, BillingProvider> = {
  stripe: stripeProvider,
  paystack: paystackProvider,
  lemonsqueezy: lemonSqueezyProvider,
  paddle: paddleProvider,
};

const DEFAULT_PROVIDER: keyof typeof PROVIDERS = "stripe";

function resolveProvider(name?: string): BillingProvider {
  if (!name) return PROVIDERS[DEFAULT_PROVIDER];
  return PROVIDERS[name] ?? PROVIDERS[DEFAULT_PROVIDER];
}

export const billingService = {
  /**
   * Start subscription checkout flow (NOT direct activation)
   * Activation must happen via webhook → Supabase update
   */
  async subscribe(opts: {
    provider?: string;
    tier: SubscriptionTier;
    userId?: string;
  }): Promise<SubscriptionStatus> {
    const provider = resolveProvider(opts.provider);

    const result = await provider.subscribe(opts.tier);

    if (!result) {
      throw new Error("Subscription failed to initialize");
    }

    return result;
  },

  /**
   * Cancel subscription via provider
   * Supabase sync handled via webhook
   */
  async cancel(opts?: {
    provider?: string;
    userId?: string;
  }): Promise<SubscriptionStatus> {
    const provider = resolveProvider(opts?.provider);

    const result = await provider.cancel();

    if (!result) {
      throw new Error("Cancellation failed");
    }

    return result;
  },

  /**
   * Always considered read-only from provider layer
   * Supabase remains authoritative, but fallback allowed
   */
  async getStatus(opts?: {
    provider?: string;
    userId?: string;
  }): Promise<SubscriptionStatus> {
    const provider = resolveProvider(opts?.provider);

    const status = await provider.getSubscriptionStatus();

    return status;
  },

  /**
   * Available payment integrations
   */
  listProviders(): string[] {
    return Object.keys(PROVIDERS);
  },
};
```
