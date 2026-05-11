import crypto from "crypto";
import { updateSubscription } from "@/lib/billing/updateSubscription";

export default async function handler(req: any, res: any) {
  const signature = req.headers["x-paystack-signature"];

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const data = event.data;

    await updateSubscription({
      userId: data.metadata?.user_id,
      tier: data.metadata?.tier,
      provider: "paystack",
      email: data.customer.email,
      providerCustomerId: data.customer.customer_code,
      providerSubscriptionId: data.reference,
    });
  }

  return res.status(200).json({ received: true });
}
