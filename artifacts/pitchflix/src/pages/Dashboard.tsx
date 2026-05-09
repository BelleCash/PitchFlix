import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { usePitches } from "@/hooks/usePitches";
import { useAuth } from "@/context/AuthContext";
import { scorePitch } from "@/services/pitchScoring";
import PitchGrid from "@/components/PitchGrid";
import CreatePitchModal from "@/components/CreatePitchModal";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=7c3aed&backgroundType=solid`;
}

export default function Dashboard() {
  const { user, userProfile, signOut, authLoading } = useAuth();
  const { pitches, loading, updateLikes } = usePitches();
  const [, navigate] = useLocation();

  const [createOpen, setCreateOpen] = useState(false);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());

  // ✅ FIX: SAFE NAVIGATION (prevents redirect flicker)
  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/");
  }, [user, authLoading, navigate]);

  // -----------------------------
  // MY PITCH IDS (LOCAL STORAGE)
  // -----------------------------
  const myIdsKey = `pf-my-${user?.id ?? ""}`;

  useEffect(() => {
    if (!user) return;

    try {
      const stored = localStorage.getItem(myIdsKey);
      setMyIds(new Set(stored ? JSON.parse(stored) : []));
    } catch {
      setMyIds(new Set());
    }
  }, [user, myIdsKey]);

  // -----------------------------
  // LIKED STATE
  // -----------------------------
  const likedKey = `pf-liked-${user?.id ?? "guest"}`;

  const [liked, setLiked] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(likedKey);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // -----------------------------
  // MY PITCHES (FIXED SAFETY)
  // -----------------------------
  const myPitches = useMemo(() => {
    if (!user) return [];

    const byUserId = pitches.filter((p) => p.user_id === user.id);
    const byLocalIds = pitches.filter((p) => myIds.has(p.id));

    const seen = new Set<string>();

    return [...byUserId, ...byLocalIds].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [pitches, user, myIds]);

  // -----------------------------
  // METRICS
  // -----------------------------
  const totalLikes = useMemo(
    () => myPitches.reduce((s, p) => s + p.likes, 0),
    [myPitches]
  );

  const totalViews = useMemo(
    () => myPitches.reduce((s, p) => s + (p.views ?? 0), 0),
    [myPitches]
  );

  const avgScore = useMemo(() => {
    if (!myPitches.length) return 0;
    return Math.round(
      myPitches.reduce((s, p) => s + scorePitch(p).overall, 0) /
        myPitches.length
    );
  }, [myPitches]);

  const activationScore = useMemo(() => {
    let s = 0;

    if (userProfile?.username) s += 30;
    if (myPitches.length > 0) s += 50;
    if (totalLikes > 0) s += 20;

    return Math.min(100, s);
  }, [userProfile?.username, myPitches.length, totalLikes]);

  // -----------------------------
  // LIKE HANDLER (FIXED IMMUTABILITY)
  // -----------------------------
  const handleLike = useCallback(
    (id: string, currentLikes: number) => {
      const next = new Set(liked);

      const isLiked = liked.has(id);

      if (isLiked) next.delete(id);
      else next.add(id);

      setLiked(next);

      try {
        localStorage.setItem(likedKey, JSON.stringify([...next]));
      } catch {}

      updateLikes(id, Math.max(0, currentLikes + (isLiked ? -1 : 1)));
    },
    [liked, likedKey, updateLikes]
  );

  // -----------------------------
  // CREATED PITCH HANDLER
  // -----------------------------
  const handleCreated = (id: string) => {
    setMyIds((prev) => {
      const next = new Set(prev);
      next.add(id);

      try {
        localStorage.setItem(myIdsKey, JSON.stringify([...next]));
      } catch {}

      return next;
    });

    toast.success("Pitch live!", {
      description: "Your pitch is now visible to everyone 🎬",
    });
  };

  // -----------------------------
  // LOADING STATES
  // -----------------------------
  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0b0b0f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid rgba(124,58,237,0.2)",
            borderTopColor: "#7c3aed",
            borderRadius: "50%",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return null;

  // -----------------------------
  // PROFILE SAFETY (FIXED NULL CRASHES)
  // -----------------------------
  const displayName =
    userProfile?.username || user.email?.split("@")[0] || "Creator";

  const avatar =
    userProfile?.avatarUrl ?? avatarUrl(displayName);

  const isCreator = userProfile?.role === "creator";

  const walletConnected = userProfile?.walletConnected ?? false;

  const creatorEarnings = userProfile?.creatorEarnings ?? 0;

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div style={{ background: "#0b0b0f", minHeight: "100vh" }}>
      <nav className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 33, height: 33, background: "#7c3aed", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🎬</div>
            <span style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.04em", color: "#fff" }}>
              Pitch<span style={{ color: "#8b5cf6" }}>Flix</span>
            </span>
          </a>

          <h1 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>
            Creator Studio
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

            <a href="/settings" style={{ color: "#e2e8f0", textDecoration: "none" }}>
              ⚙️ Settings
            </a>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "52px 28px 120px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 900 }}>
              {displayName}.
            </h2>
          </div>

          <button className="btn-purple" onClick={() => setCreateOpen(true)}>
            🎬 New Pitch
          </button>
        </div>

        {/* GRID */}
        <PitchGrid
          pitches={myPitches}
          loading={loading}
          liked={liked}
          onLike={handleLike}
        />
      </main>

      <CreatePitchModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
