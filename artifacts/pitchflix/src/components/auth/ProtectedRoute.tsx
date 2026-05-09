import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { canAccess, type AppFeature } from "@/lib/roleAccess";

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature: AppFeature;
  fallback?: string;
}

export default function ProtectedRoute({
  children,
  feature,
  fallback = "/",
}: ProtectedRouteProps) {
  const { userProfile, authLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (authLoading) return;

    if (!userProfile || !canAccess(userProfile, feature)) {
      navigate(fallback);
    }
  }, [userProfile, authLoading, feature, fallback, navigate]);

  if (authLoading) return null;
  if (!userProfile) return null;
  if (!canAccess(userProfile, feature)) return null;

  return <>{children}</>;
}
