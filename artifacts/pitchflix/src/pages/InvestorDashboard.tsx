import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBilling } from "@/context/BillingContext";
import { usePitches } from "@/hooks/usePitches";
import { scorePitch } from "@/services/pitchScoring";
import InvestorPaywall from "@/components/billing/InvestorPaywall";
import type { Pitch } from "@/types";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=7c3aed&backgroundType=solid`;}

export default function InvestorDashboard() {
  const { user, userProfile } = useAuth();
  const { tier = "free", isSubscribed } = useBilling();
  const { pitches, loading } = usePitches();
  const [, navigate] = useLocation();

  const storageKey = `pf-watch-${user?.id ?? "guest"}`;

  const [watchlist, setWatchlist] = useState<Set<string>>(() => {
    try {
      if (typeof window === "undefined") return new Set<string>();
      return new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]"));
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      setWatchlist(new Set(saved));
    } catch {
      setWatchlist(new Set());
    }
  }, [storageKey]);

  const trending = useMemo(
    () => pitches.filter((p) => p.trending).slice(0, 6),
    [pitches]
  );

  const watchlisted = useMemo(
    () => pitches.filter((p) => watchlist.has(p.id)),
    [pitches, watchlist]
  );

  const topScored = useMemo(
    () =>
      [...pitches]
        .sort((a, b) => scorePitch(b).overall - scorePitch(a).overall)
        .slice(0, 6),
    [pitches]
  );

  const needsUpgrade =
    userProfile?.role === "investor" && !isSubscribed && tier === "free";

  if (needsUpgrade) return <InvestorPaywall />;

  const toggleWatch = (id: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Removed from watchlist");
      } else {
        next.add(id);
        toast.success("Added to watchlist 👀");
      }

      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {}

      return next;
    });
  };

  const displayName =
    userProfile?.username || user?.email?.split("@")[0] || "Investor";
  const avatar = userProfile?.avatarUrl ?? avatarUrl(displayName);

  const walletConnected = userProfile?.walletConnected ?? false;
  const walletBalance = userProfile?.investorWalletBalance ?? 0;

  const totalPortfolio = watchlist.size;

  return (
    <div style={{ background: "#0b0b0f", minHeight: "100vh", paddingBottom: 80 }}>
      <nav className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div
          style={{
            maxWidth: 1380,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 66,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 33,
                height: 33,
                background: "#7c3aed",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 17,
              }}
            >
              🎬
            </div>
            <span
              style={{
                fontSize: 21,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "#fff",
              }}
            >
              Pitch<span style={{ color: "#8b5cf6" }}>Flix</span>
            </span>
          </a>

          <h1 style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>
            💼 Deal Flow
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
                padding: "4px 12px",
                borderRadius: 50,
                fontSize: 11,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              {(tier ?? "free").toUpperCase()}
            </div>

            <img
              src={avatar}
              alt={displayName}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid rgba(124,58,237,0.4)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = avatarUrl(displayName);
              }}
            />

            <a
              href="/settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 9,
                padding: "8px 14px",
                color: "#e2e8f0",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              ⚙️
            </a>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "44px 28px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 36,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <img
              src={avatar}
              alt={displayName}
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                objectFit: "cover",
                border: "3px solid rgba(124,58,237,0.4)",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = avatarUrl(displayName);
              }}
            />
            <div>
              <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 4 }}>
                Investor View
              </p>
              <h2 style={{ fontSize: 26, fontWeight: 900 }}>
                Deal<span style={{ color: "#8b5cf6" }}>Flow</span> Dashboard
              </h2>
            </div>
          </div>

          <button className="btn-purple" onClick={() => navigate("/")}>
            Browse Marketplace
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 14,
            marginBottom: 44,
          }}
        >
          <KPI label="Active Pitches" value={String(pitches.length)} sub="In marketplace" icon="🎬" />
          <KPI label="Trending Now" value={String(trending.length)} sub="Gaining momentum" icon="🔥" />
          <KPI label="Watchlisted" value={String(totalPortfolio)} sub="Saved opportunities" icon="👁" />
          <KPI
            label="Portfolio Value"
            value={walletConnected ? `$${walletBalance.toLocaleString()}` : "—"}
            sub="Capital deployed"
            icon="💎"
          />
        </div>

        <Panel title="🔥 Trending Deals" sub={`${trending.length} gaining traction`}>
          {loading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />
              ))
            : trending.map((p) => (
                <DealRow
                  key={p.id}
                  pitch={p}
                  watched={watchlist.has(p.id)}
                  onWatch={() => toggleWatch(p.id)}
                />
              ))}
        </Panel>
      </main>
    </div>
  );
}

function KPI({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#12121a",
        border: "1px solid rgba(124,58,237,0.1)",
        borderRadius: 18,
        padding: "22px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700 }}>{label}</span>
        <span>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#4b5563" }}>{sub}</div>
    </div>
  );
}

function Panel({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#12121a",
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h3 style={{ fontWeight: 800 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#4b5563", marginBottom: 16 }}>{sub}</p>
      {children}
    </div>
  );
}

function DealRow({
  pitch,
  watched,
  onWatch,
}: {
  pitch: Pitch;
  watched: boolean;
  onWatch: () => void;
}) {
  const [, navigate] = useLocation();
  const s = scorePitch(pitch);

  return (
    <div
      onClick={() => navigate(`/pitch/${pitch.id}`)}
      style={{
        display: "flex",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{pitch.title}</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>
          {pitch.genre} · Score {s.overall}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onWatch();
        }}
      >
        👁
      </button>
    </div>
  );
}
