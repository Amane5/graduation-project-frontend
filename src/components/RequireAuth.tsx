import { type ReactNode, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  createLoginRedirectState,
  getLocationTarget,
} from "@/lib/auth-routes";
import LoadingScreen from "./LoadingScreen";

const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading, logoutReason } = useAuth();
  const location = useLocation();
  const warnedRef = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated || warnedRef.current) {
      return;
    }

    warnedRef.current = true;

    if (logoutReason === "logout") {
      return;
    }

    if (logoutReason === "expired") {
      toast("Please login to continue", {
        description: "Your session expired.",
      });
      return;
    }

    toast("Please login to continue", {
      description: "Your session was not found.",
    });
  }, [isAuthenticated, isLoading, logoutReason]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={createLoginRedirectState(
          getLocationTarget(location),
          logoutReason ?? "unauthorized",
        )}
      />
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
