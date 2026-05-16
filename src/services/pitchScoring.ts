import type { Pitch } from "@/types";

export interface PitchScore {
  overall: number;
  clarity: number;
  originality: number;
  marketPotential: number;
  engagement: number;
  risk: number;
  fundingProbability: "Low" | "Medium" | "High" | "Very High";
  riskLevel: "Low" | "Medium" | "High";
  label: string;
}

const HIGH_POTENTIAL_GENRES = ["Sci-Fi", "Thriller", "Action", "Nollywood"];
const TRENDING_GENRES = ["Nollywood", "Action", "Thriller"];

export function scorePitch(pitch: Pitch): PitchScore {
  const tagCount = pitch.tags?.length ?? 0;

  const hasSynopsis = (pitch.synopsis?.length ?? 0) > 60;
  const hasVideo = Boolean(pitch.video_url);

  const likes = pitch.likes ?? 0;
  const views = (pitch as any).views ?? 0;
  const comments = (pitch as any).comment_count ?? 0;

  const titleLen = pitch.title?.length ?? 0;
  const loglineLen = pitch.logline?.length ?? 0;

  // -----------------------
  // CLARITY
  // -----------------------
  const clarity =
    Math.min(
      100,
      (loglineLen > 40 ? 30 : 10) +
        (hasSynopsis ? 25 : 0) +
        (titleLen > 3 ? 15 : 0) +
        (tagCount >= 3 ? 15 : tagCount * 5) +
        (hasVideo ? 15 : 0) +
        5
    );

  // -----------------------
  // ORIGINALITY
  // -----------------------
  const originality = Math.min(
    100,
    (TRENDING_GENRES.includes(pitch.genre) ? 20 : 10) +
      (tagCount > 4 ? 20 : tagCount * 4) +
      (hasSynopsis ? 20 : 0) +
      (hasVideo ? 15 : 0) +
      Math.min(25, Math.floor(likes / 100) * 5)
  );

  // -----------------------
  // ENGAGEMENT
  // -----------------------
  const engagement = Math.min(
    100,
    Math.min(40, Math.floor(likes / 60) * 5) +
      Math.min(25, Math.floor(views / 30) * 3) +
      Math.min(25, comments * 6) +
      (pitch.trending ? 10 : 0)
  );

  // -----------------------
  // MARKET POTENTIAL
  // -----------------------
  const marketPotential = Math.min(
    100,
    (HIGH_POTENTIAL_GENRES.includes(pitch.genre) ? 30 : 18) +
      (pitch.trending ? 15 : 0) +
      (tagCount >= 2 ? 15 : tagCount * 3) +
      Math.min(40, Math.floor(likes / 80) * 5)
  );

  // -----------------------
  // RISK (higher rawRisk = worse, so invert later)
  // -----------------------
  const rawRisk =
    (hasSynopsis ? 0 : 20) +
    (tagCount === 0 ? 15 : 0) +
    (!hasVideo ? 10 : 0) +
    Math.max(0, 30 - Math.floor(likes / 40) * 5);

  const risk = Math.max(0, 100 - rawRisk);

  // -----------------------
  // OVERALL SCORE
  // -----------------------
  const overall = Math.round(
    clarity * 0.2 +
      originality * 0.2 +
      engagement * 0.25 +
      marketPotential * 0.2 +
      risk * 0.15
  );

  const fundingProbability: PitchScore["fundingProbability"] =
    overall >= 80
      ? "Very High"
      : overall >= 65
      ? "High"
      : overall >= 45
      ? "Medium"
      : "Low";

  const riskLevel: PitchScore["riskLevel"] =
    rawRisk >= 35 ? "High" : rawRisk >= 15 ? "Medium" : "Low";

  const label =
    overall >= 85
      ? "Exceptional"
      : overall >= 75
      ? "Strong"
      : overall >= 60
      ? "Promising"
      : overall >= 45
      ? "Developing"
      : "Early Stage";

  return {
    overall,
    clarity: Math.round(clarity),
    originality: Math.round(originality),
    marketPotential: Math.round(marketPotential),
    engagement: Math.round(engagement),
    risk: Math.round(risk),
    fundingProbability,
    riskLevel,
    label,
  };
}
