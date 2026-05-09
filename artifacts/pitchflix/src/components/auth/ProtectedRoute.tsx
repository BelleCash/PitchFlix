import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature?: "browse" | "create_pitch" | "invest";
  fallback?: string;
}

export default function ProtectedRoute({
  children,
  feature,
  fallback = "/",
}: ProtectedRouteProps) {
  const { user, userProfile, authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate(fallback);
      return;
    }

    if (feature && !canAccess(userProfile, feature)) {
      navigate(fallback);
    }
  }, [user, userProfile, authLoading, feature, fallback, navigate]);

  if (authLoading || !user) return null;

  if (feature && !canAccess(userProfile, feature)) return null;

  return <>{children}</>;
}
