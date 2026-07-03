import { Navigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";

export const HomeRedirect = () => {
  const { isAuthenticated, isLoading, role, getHomeRoute } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated && role) {
    return <Navigate to={getHomeRoute(role)} replace />;
  }

  return <Navigate to="/login" replace />;
};
