import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Missing authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const { data: subscription, error } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error || !subscription) {
      return res.status(200).json({
        subscribed: false,
        tier: "free",
        status: "inactive",
        provider: null,
      });
    }

    return res.status(200).json({
      subscribed: true,
      tier: subscription.tier,
      status: subscription.status,
      provider: subscription.provider,
      currentPeriodEnd: subscription.current_period_end,
    });
  } catch (error: any) {
    console.error("Billing status error:", error);

    return res.status(500).json({
      error: error.message ?? "Internal server error",
    });
  }
}
