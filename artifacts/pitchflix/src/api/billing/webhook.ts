import crypto from "crypto";
const paystackSignature = req.headers["x-paystack-signature"];

if (paystackSignature) {
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== paystackSignature) {
    return res.status(401).send("Invalid Paystack signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const data = event.data;

    const userId = data.metadata?.user_id;
    const tier = data.metadata?.tier;

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: userId,
      provider: "paystack",
      tier,
      status: "active",
      customer_email: data.customer.email,
      provider_customer_id: data.customer.customer_code,
      provider_subscription_id: data.reference,
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: tier,
      })
      .eq("id", userId);
  }

  return res.status(200).json({
    received: true,
  });
}
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // =====================================
  // PAYMENT SUCCESS
  // =====================================

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;
    const tier = session.metadata?.tier;

    if (!userId) {
      return res.status(400).send("Missing user ID");
    }

    await supabaseAdmin.from("subscriptions").upsert({
      user_id: userId,
      provider: "stripe",
      tier,
      status: "active",
      customer_email: session.customer_details?.email,
      provider_customer_id: String(session.customer ?? ""),
      provider_subscription_id: String(session.subscription ?? ""),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      updated_at: new Date().toISOString(),
    });

    // OPTIONAL:
    // sync profile subscription tier

    await supabaseAdmin
      .from("profiles")
      .update({
        subscription_tier: tier,
      })
      .eq("id", userId);
  }

  // =====================================
  // SUBSCRIPTION CANCELLED
  // =====================================

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;

    await supabaseAdmin
      .from("subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("provider_subscription_id", subscription.id);
  }

  return res.status(200).json({
    received: true,
  });
}
