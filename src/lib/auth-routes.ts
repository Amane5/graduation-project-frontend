import { matchPath } from "react-router-dom";
import type { AuthRedirectState, UserType } from "./auth-session";

const HOME_ROUTES = {
  parent: "/dashboard",
  child: "/chat",
} as const satisfies Record<UserType, string>;

const PUBLIC_ONLY_PATHS = ["/login", "/register"] as const;

const PUBLIC_PATHS = ["/verify-email"] as const;

const PARENT_PATTERNS = [
  "/dashboard",
  "/add-child",
  "/edit-child/:id",
  "/history",
  "/accounts",
  "/profile",
  "/story-generator",
  "/my-files",
  "/children-stories",
  "/reports/:childId",
  "/reports/story/:storyId",
  "/challenges",
  "/challenges/create",
  "/challenge/:id",
  "/challenge/:id/edit",
] as const;

const CHILD_PATTERNS = [
  "/my-challenges",
  "/challenge/:id/play",
  "/challenge/:id/results",
] as const;

const SHARED_PATTERNS = [
  "/chat",
  "/chat/:id",
  "/my-stories",
  "/my-stories/:childId",
] as const;

const normalizePath = (target?: string | null) => {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return null;
  }

  return target;
};

const getPathname = (target: string) => {
  const [pathname] = target.split(/[?#]/, 1);
  return pathname || "/";
};

const matchesAnyPattern = (pathname: string, patterns: readonly string[]) =>
  patterns.some((pattern) =>
    Boolean(
      matchPath(
        {
          path: pattern,
          end: true,
        },
        pathname,
      ),
    ),
  );

export const getHomeRoute = (role: UserType) => HOME_ROUTES[role];

export const isPublicOnlyPath = (pathname: string) =>
  PUBLIC_ONLY_PATHS.includes(pathname as (typeof PUBLIC_ONLY_PATHS)[number]);

export const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]);

export const canAccessRoute = (
  role: UserType,
  target: string,
) => {
  const pathname = getPathname(target);

  if (pathname === "/") {
    return true;
  }

  if (isPublicOnlyPath(pathname) || isPublicPath(pathname)) {
    return false;
  }

  if (matchesAnyPattern(pathname, SHARED_PATTERNS)) {
    return true;
  }

  return role === "parent"
    ? matchesAnyPattern(pathname, PARENT_PATTERNS)
    : matchesAnyPattern(pathname, CHILD_PATTERNS);
};

export const resolveRedirectTarget = (
  target: string | null | undefined,
  role: UserType,
) => {
  const normalizedTarget = normalizePath(target);

  if (!normalizedTarget || normalizedTarget === "/") {
    return getHomeRoute(role);
  }

  return canAccessRoute(role, normalizedTarget)
    ? normalizedTarget
    : getHomeRoute(role);
};

export const getLocationTarget = (location: {
  pathname: string;
  search?: string;
  hash?: string;
}) => `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`;

export const createLoginRedirectState = (
  from: string,
  reason: AuthRedirectState["reason"],
) => ({
  from,
  reason,
} satisfies AuthRedirectState);
