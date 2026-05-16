import { useState } from "react";
import { useLocation } from "wouter";
import { useBilling } from "@/context/BillingContext";
import { toast } from "sonner";

export default function InvestorPaywall() {
  const { subscribe } = useBilling();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // SINGLE SOURCE OF TRUTH: BillingContext -> BillingService -> Provider (Stripe/Paystack/etc)
      await subscribe("pro");
      toast.success("Investor access unlocked 🚀");
      window.location.reload();
    } catch (err) {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0b0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center" }}>
        <div
          style={{
            width: 80,
            height: 80,
            background: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.3)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            margin: "0 auto 28px",
          }}
        >
          💼
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
          Investor Access Required
        </h1>

        <p style={{ color: "#9ca3af", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Unlock deal flow, watchlists, and creator discovery with a Pro Investor subscription.
        </p>

        <div
          style={{
            background: "#12121a",
            border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 20,
            padding: 28,
            marginBottom: 24,
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div
              style={{
                background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
                borderRadius: 10,
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              PRO INVESTOR
            </div>

            <div style={{ fontSize: 22, fontWeight: 900 }}>
              $19
              <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 400 }}>/mo</span>
            </div>
          </div>

          {[
            "Investor dashboard & KPIs",
            "Deal pipeline tracking",
            "Creator watchlists",
            "Trending pitch alerts",
            "Real-time marketplace data",
          ].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                color: "#d1d5db",
                fontSize: 14,
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {f}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn-purple"
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              flex: 1,
              maxWidth: 240,
              justifyContent: "center",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : "💼 Unlock Investor Access"}
          </button>

          <button
            className="btn-ghost"
            onClick={() => navigate("/pricing")}
            style={{ flex: 1, maxWidth: 160, justifyContent: "center" }}
          >
            See all plans
          </button>
        </div>

        <p style={{ color: "#4b5563", fontSize: 12, marginTop: 16 }}>
          Secure checkout — handled via Stripe / Paystack / LemonSqueezy / Paddle (Supabase-backed).
        </p>
      </div>
    </div>
  );
}
