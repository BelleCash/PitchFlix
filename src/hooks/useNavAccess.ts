import { useAuth } from "@/context/AuthContext";
import { canAccess } from "@/lib/roleAccess";

export function useNavAccess() {
  const { userProfile } = useAuth();

  return {
    canCreatePitch: canAccess(userProfile, "create_pitch"),
    canInvest: canAccess(userProfile, "invest"),
  };
}
