import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AuthLogoutReason,
  type AuthSession,
  type AuthStatus,
  type AuthUser,
  clearStoredAuthSession,
  readStoredAuthSession,
  setStoredAuthSession,
  subscribeToAuthSessionEvents,
  subscribeToAuthStorage,
  type UserType,
  updateStoredAuthUser,
} from "@/lib/auth-session";
import {
  canAccessRoute,
  getHomeRoute,
  resolveRedirectTarget,
} from "@/lib/auth-routes";

interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  logoutReason: AuthLogoutReason | null;
}

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  accessToken: string | null;
  user: AuthUser | null;
  userType: UserType | null;
  role: UserType | null;
  username: string | null;
  firstName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logoutReason: AuthLogoutReason | null;
  signIn: (session: AuthSession) => void;
  signOut: (options?: { reason?: AuthLogoutReason }) => void;
  login: (
    token: string,
    userType: UserType,
    username: string,
    user?: AuthUser,
    firstName?: string,
  ) => void;
  logout: (options?: { reason?: AuthLogoutReason }) => void;
  updateSessionUser: (user: AuthUser) => void;
  hasRole: (role: UserType) => boolean;
  canAccess: (target: string, roleOverride?: UserType | null) => boolean;
  getHomeRoute: (roleOverride?: UserType | null) => string;
  resolveRedirectTarget: (target?: string | null, roleOverride?: UserType | null) => string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getAnonymousState = (
  reason: AuthLogoutReason | null = null,
): AuthState => ({
  status: "anonymous",
  session: null,
  logoutReason: reason,
});

const getInitialState = (): AuthState => ({
  status: "loading",
  session: null,
  logoutReason: null,
});

export type { AuthSession, AuthStatus, AuthUser, UserType } from "@/lib/auth-session";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(getInitialState);

  const hydrateFromStorage = useCallback((reason: AuthLogoutReason | null = null) => {
    const session = readStoredAuthSession();

    setState(
      session
        ? {
            status: "authenticated",
            session,
            logoutReason: null,
          }
        : getAnonymousState(reason),
    );
  }, []);

  useEffect(() => {
    hydrateFromStorage();

    const unsubscribeStorage = subscribeToAuthStorage(() => {
      hydrateFromStorage();
    });

    const unsubscribeSession = subscribeToAuthSessionEvents((detail) => {
      setState(
        detail.session
          ? {
              status: "authenticated",
              session: detail.session,
              logoutReason: null,
            }
          : getAnonymousState(detail.reason ?? null),
      );
    });

    return () => {
      unsubscribeStorage();
      unsubscribeSession();
    };
  }, [hydrateFromStorage]);

  const signIn = useCallback((session: AuthSession) => {
    setStoredAuthSession(session);
  }, []);

  const signOut = useCallback((options?: { reason?: AuthLogoutReason }) => {
    clearStoredAuthSession(options?.reason ?? "logout");
  }, []);

  const login = useCallback(
    (
      token: string,
      userType: UserType,
      username: string,
      user?: AuthUser,
      firstName?: string,
    ) => {
      if (!user) {
        throw new Error("login requires a user payload");
      }

      signIn({
        accessToken: token,
        user: {
          ...user,
          type: userType,
          username,
          firstName: firstName ?? user.firstName,
        },
      });
    },
    [signIn],
  );

  const updateSessionUser = useCallback((user: AuthUser) => {
    updateStoredAuthUser(user);
  }, []);

  const role = state.session?.user.type ?? null;

  const hasRole = useCallback(
    (expectedRole: UserType) => role === expectedRole,
    [role],
  );

  const canAccess = useCallback(
    (target: string, roleOverride?: UserType | null) => {
      const effectiveRole = roleOverride ?? role;

      return effectiveRole ? canAccessRoute(effectiveRole, target) : false;
    },
    [role],
  );

  const getResolvedHomeRoute = useCallback(
    (roleOverride?: UserType | null) => {
      const effectiveRole = roleOverride ?? role;

      return effectiveRole ? getHomeRoute(effectiveRole) : "/login";
    },
    [role],
  );

  const getResolvedRedirectTarget = useCallback(
    (target?: string | null, roleOverride?: UserType | null) => {
      const effectiveRole = roleOverride ?? role;

      return effectiveRole
        ? resolveRedirectTarget(target, effectiveRole)
        : "/login";
    },
    [role],
  );

  const value = useMemo<AuthContextValue>(() => {
    const user = state.session?.user ?? null;

    return {
      status: state.status,
      session: state.session,
      accessToken: state.session?.accessToken ?? null,
      user,
      userType: role,
      role,
      username: user?.username ?? null,
      firstName: user?.firstName ?? null,
      isAuthenticated: state.status === "authenticated",
      isLoading: state.status === "loading",
      logoutReason: state.logoutReason,
      signIn,
      signOut,
      login,
      logout: signOut,
      updateSessionUser,
      hasRole,
      canAccess,
      getHomeRoute: getResolvedHomeRoute,
      resolveRedirectTarget: getResolvedRedirectTarget,
    };
  }, [
    canAccess,
    getResolvedHomeRoute,
    getResolvedRedirectTarget,
    hasRole,
    login,
    role,
    signIn,
    signOut,
    state.logoutReason,
    state.session,
    state.status,
    updateSessionUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
