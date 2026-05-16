import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { usePitches } from "@/hooks/usePitches";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { scorePitch } from "@/services/pitchScoring";
import type { Comment, Pitch } from "@/types";

const FALLBACK =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80&auto=format&fit=crop";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=7c3aed&backgroundType=solid`;
}

function getVideoEmbed(url: string): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

function trendBadge(pitch: Pitch) {
  if (pitch.trending && (pitch.likes ?? 0) > 1500)
    return {
      emoji: "🔥",
      label: "Trending",
      color: "#fff",
      bg: "linear-gradient(135deg,#7c3aed,#8b5cf6)",
    };
  if (pitch.trending)
    return {
      emoji: "🚀",
      label: "Rising Fast",
      color: "#4ade80",
      bg: "rgba(74,222,128,0.12)",
    };
  if ((pitch.likes ?? 0) > 800)
    return {
      emoji: "💎",
      label: "Hidden Gem",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.12)",
    };
  return null;
}

const SCORE_COLORS: Record<string, string> = {
  clarity: "#8b5cf6",
  originality: "#a855f7",
  marketPotential: "#7c3aed",
  engagement: "#6d28d9",
  risk: "#4ade80",
};

export default function PitchDetail() {
  const [, params] = useRoute("/pitch/:id");
  const [, navigate] = useLocation();
  const { pitches, updateLikes, recordView } = usePitches();
  const { user, userProfile } = useAuth();

  const id = params?.id ?? "";
  const pitch = useMemo(
    () => pitches.find((p) => p.id === id) ?? null,
    [pitches, id]
  );

  const likedKey = useMemo(
    () => `pf-liked-${user?.id ?? "guest"}`,
    [user?.id]
  );

  const watchKey = useMemo(
    () => `pf-watch-${user?.id ?? "guest"}`,
    [user?.id]
  );

  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set());

  const [localLikes, setLocalLikes] = useState<number | null>(null);
  const [voted, setVoted] = useState<"up" | "down" | null>(null);
  const [votes, setVotes] = useState({ up: 12, down: 2 });

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const viewedRef = useRef(false);

  // ✅ FIX: redirect safely
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // ✅ FIX: hydrate liked/watchlisted per user
  useEffect(() => {
    try {
      setLiked(new Set(JSON.parse(localStorage.getItem(likedKey) ?? "[]")));
    } catch {
      setLiked(new Set());
    }

    try {
      setWatchlisted(
        new Set(JSON.parse(localStorage.getItem(watchKey) ?? "[]"))
      );
    } catch {
      setWatchlisted(new Set());
    }
  }, [likedKey, watchKey]);

  useEffect(() => {
    if (pitch) setLocalLikes(pitch.likes);
  }, [pitch?.id]);

  useEffect(() => {
    if (!id || viewedRef.current) return;
    viewedRef.current = true;
    recordView(id, user?.id);
  }, [id, user?.id, recordView]);

  useEffect(() => {
    if (!id) return;

    setCommentsLoading(true);

    (async () => {
      if (!supabase) return;

      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username, avatar_url)")
        .eq("pitch_id", id)
        .order("created_at", { ascending: true });

      const formatted =
        data?.map((c: any) => ({
          id: String(c.id),
          pitch_id: c.pitch_id,
          user_id: c.user_id,
          content: c.content,
          created_at: c.created_at,
          author_name: c.profiles?.username ?? "Investor",
          author_avatar: c.profiles?.avatar_url ?? avatarUrl(c.user_id),
        })) ?? [];

      setComments(formatted);
      setCommentsLoading(false);
    })();
  }, [id]);

  const displayLikes = localLikes ?? pitch?.likes ?? 0;
  const isLiked = liked.has(id);
  const isInWatchlist = watchlisted.has(id);
  const isInvestor = userProfile?.role === "investor";
  const score = pitch ? scorePitch(pitch) : null;

  const handleLike = useCallback(() => {
    if (!pitch || !user) return toast("Sign in to like pitches");

    const next = new Set(liked);

    if (next.has(pitch.id)) next.delete(pitch.id);
    else next.add(pitch.id);

    setLiked(next);
    localStorage.setItem(likedKey, JSON.stringify([...next]));

    const newLikes = displayLikes + (next.has(pitch.id) ? 1 : -1);
    setLocalLikes(newLikes);
    updateLikes(pitch.id, newLikes);
  }, [pitch, user, liked, likedKey, displayLikes, updateLikes]);

  const handleWatchlist = () => {
    if (!user) return toast("Sign in to save pitches");

    const next = new Set(watchlisted);

    if (next.has(id)) next.delete(id);
    else next.add(id);

    setWatchlisted(next);
    localStorage.setItem(watchKey, JSON.stringify([...next]));
  };

  const handleComment = async () => {
    if (!commentText.trim() || !user || !isInvestor) return;

    setCommentLoading(true);

    try {
      const newComment: Comment = {
        id: String(Date.now()),
        pitch_id: id,
        user_id: user.id,
        content: commentText.trim(),
        created_at: new Date().toISOString(),
        author_name:
          userProfile?.username || user.email?.split("@")[0] || "Investor",
        author_avatar:
          userProfile?.avatar_url ?? avatarUrl(userProfile?.username || "user"),
      };

      if (supabase) {
        await supabase
          .from("comments")
          .insert({
            pitch_id: id,
            user_id: user.id,
            content: commentText.trim(),
          });
      }

      setComments((prev) => [...prev, newComment]);
      setCommentText("");
      toast.success("Comment posted!");
    } finally {
      setCommentLoading(false);
    }
  };

  if (!pitch) return null;

  const badge = trendBadge(pitch);
  const embedUrl = pitch.video_url ? getVideoEmbed(pitch.video_url) : null;

  return (
    <div>
      {/* UI unchanged for brevity — keep your existing JSX */}
    </div>
  );
}
