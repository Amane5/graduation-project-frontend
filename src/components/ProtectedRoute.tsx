import type { ReactNode } from "react";
import { type UserType } from "@/contexts/AuthContext";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

interface ProtectedRouteProps {
  children: ReactNode;
  allow?: UserType[];
}

const ProtectedRoute = ({ children, allow }: ProtectedRouteProps) => {
  return (
    <RequireAuth>
      {allow ? <RequireRole allow={allow}>{children}</RequireRole> : children}
    </RequireAuth>
  );
};

export default ProtectedRoute;
