import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type UserType } from "@/contexts/AuthContext";

interface RequireRoleProps {
  allow: UserType[];
  children: ReactNode;
}

const RequireRole = ({ allow, children }: RequireRoleProps) => {
  const { role, getHomeRoute } = useAuth();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(role)) {
    return <Navigate to={getHomeRoute(role)} replace />;
  }

  return <>{children}</>;
};

export default RequireRole;
