import Stripe from "stripe";
import { updateSubscription } from "@/lib/billing/updateSubscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(err.message);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await updateSubscription({
      userId: session.metadata?.user_id,
      tier: session.metadata?.tier,
      provider: "stripe",
      email: session.customer_details?.email,
      providerCustomerId: session.customer,
      providerSubscriptionId: session.subscription,
    });
  }

  return res.status(200).json({ received: true });
}
