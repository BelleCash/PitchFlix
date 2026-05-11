import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // TODO: replace with real auth user id (from session/JWT)
  const userId = req.headers["x-user-id"];

  if (!userId) {
    return res.status(401).json({ error: "Missing user id" });
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return res.status(200).json({
      tier: "free",
      status: "inactive",
    });
  }

  return res.status(200).json({
    tier: data.tier,
    status: data.status,
    provider: data.provider,
  });
}
