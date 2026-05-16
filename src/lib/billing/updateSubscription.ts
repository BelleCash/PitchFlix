import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function updateSubscription({
  userId,
  tier,
  provider,
  email,
  providerCustomerId,
  providerSubscriptionId,
  status = "active",
}: any) {
  await supabaseAdmin.from("subscriptions").upsert({
    user_id: userId,
    tier,
    provider,
    status,
    customer_email: email,
    provider_customer_id: providerCustomerId,
    provider_subscription_id: providerSubscriptionId,
    updated_at: new Date().toISOString(),
  });

  await supabaseAdmin
    .from("profiles")
    .update({
      subscription_tier: tier,
    })
    .eq("id", userId);
}
