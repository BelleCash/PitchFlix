import type { UserProfile, UserRole } from "@/types";

export type AppFeature =
  | "browse"
  | "create_pitch"
  | "invest"
  | "admin"
  | "settings";

export function canAccess(
  profile: UserProfile | null,
  feature: AppFeature
): boolean {
  if (!profile) return false;

  const role = profile.role;
  const tier = profile.subscriptionTier;

  // VIEWER (base level)
  if (role === "viewer") {
    return feature === "browse" || feature === "settings";
  }

  // CREATOR
  if (role === "creator") {
    if (feature === "browse") return true;
    if (feature === "create_pitch") return tier !== "free";
    if (feature === "settings") return true;
    return false;
  }

  // INVESTOR
  if (role === "investor") {
    if (feature === "browse") return true;
    if (feature === "invest") return tier !== "free";
    if (feature === "settings") return true;
    return false;
  }

  // ADMIN override
  if (role === "admin") return true;

  return false;
}
