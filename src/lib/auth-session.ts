export type UserType = "parent" | "child";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthLogoutReason = "logout" | "expired" | "unauthorized";

export type AuthRedirectReason =
  | AuthLogoutReason
  | "forbidden";

export interface AuthRedirectState {
  from?: string;
  reason?: AuthRedirectReason;
}

export interface AuthUser {
  id: number;
  username: string;
  type: UserType;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  gender?: string;
  readingLevel?: string;
  responseLength?: string;
  learningStyle?: string;
  interests?: string[];
  blockedTopics?: string[];
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

export interface AuthSessionEventDetail {
  action: "signed-in" | "signed-out" | "updated";
  reason?: AuthLogoutReason;
  session: AuthSession | null;
}

const AUTH_SESSION_KEY = "auth.session.v1";
const AUTH_SESSION_EVENT = "auth:session-change";

const LEGACY_AUTH_KEYS = [
  "accessToken",
  "userType",
  "username",
  "firstName",
  "USER_KEY",
  "gender",
  "readingLevel",
  "responseLength",
  "learningStyle",
  "interests",
  "blockedTopics",
  "fcmToken",
] as const;

const isBrowser = typeof window !== "undefined";

const safeParseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const isUserType = (value: unknown): value is UserType =>
  value === "parent" || value === "child";

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const normalizeAuthUser = (
  value: unknown,
  fallbackRole?: UserType | null,
): AuthUser | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = record.id;
  const username = record.username;
  const role = record.type ?? fallbackRole;

  if (
    typeof id !== "number" ||
    typeof username !== "string" ||
    !isUserType(role)
  ) {
    return null;
  }

  return {
    id,
    username,
    type: role,
    firstName:
      typeof record.firstName === "string" ? record.firstName : undefined,
    lastName:
      typeof record.lastName === "string" ? record.lastName : undefined,
    // email:
    //   typeof record.email === "string" || record.email === null
    //     ? (record.email as string ?? null)
    //     : undefined,
    email:
    typeof record.email === "string"
    ? record.email
    : record.email === null
      ? null
      : undefined,
    gender: typeof record.gender === "string" ? record.gender : undefined,
    readingLevel:
      typeof record.readingLevel === "string"
        ? record.readingLevel
        : undefined,
    responseLength:
      typeof record.responseLength === "string"
        ? record.responseLength
        : undefined,
    learningStyle:
      typeof record.learningStyle === "string"
        ? record.learningStyle
        : undefined,
    interests: isStringArray(record.interests) ? record.interests : undefined,
    blockedTopics: isStringArray(record.blockedTopics)
      ? record.blockedTopics
      : undefined,
  };
};

const normalizeAuthSession = (value: unknown): AuthSession | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (typeof record.accessToken !== "string") {
    return null;
  }

  const user = normalizeAuthUser(record.user);

  if (!user) {
    return null;
  }

  return {
    accessToken: record.accessToken,
    user,
  };
};

const clearLegacyAuthKeys = () => {
  if (!isBrowser) {
    return;
  }

  for (const key of LEGACY_AUTH_KEYS) {
    window.localStorage.removeItem(key);
  }
};

const readLegacySession = (): AuthSession | null => {
  if (!isBrowser) {
    return null;
  }

  const accessToken = window.localStorage.getItem("accessToken");
  const storedUser = safeParseJson<unknown>(window.localStorage.getItem("USER_KEY"));
  const storedRole = window.localStorage.getItem("userType");
  const user = normalizeAuthUser(
    storedUser,
    isUserType(storedRole) ? storedRole : null,
  );

  if (!accessToken || !user) {
    return null;
  }

  const session = {
    accessToken,
    user: {
      ...user,
      firstName:
        user.firstName ??
        window.localStorage.getItem("firstName") ??
        undefined,
      gender: user.gender ?? window.localStorage.getItem("gender") ?? undefined,
      readingLevel:
        user.readingLevel ??
        window.localStorage.getItem("readingLevel") ??
        undefined,
      responseLength:
        user.responseLength ??
        window.localStorage.getItem("responseLength") ??
        undefined,
      learningStyle:
        user.learningStyle ??
        window.localStorage.getItem("learningStyle") ??
        undefined,
      interests:
        user.interests ??
        safeParseJson<string[]>(window.localStorage.getItem("interests")) ??
        undefined,
      blockedTopics:
        user.blockedTopics ??
        safeParseJson<string[]>(window.localStorage.getItem("blockedTopics")) ??
        undefined,
    },
  } satisfies AuthSession;

  persistAuthSession(session);
  clearLegacyAuthKeys();

  return session;
};

export const readStoredAuthSession = (): AuthSession | null => {
  if (!isBrowser) {
    return null;
  }

  const stored = safeParseJson<unknown>(
    window.localStorage.getItem(AUTH_SESSION_KEY),
  );
  const session = normalizeAuthSession(stored);

  if (session) {
    return session;
  }

  if (stored) {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
  }

  return readLegacySession();
};

export const dispatchAuthSessionEvent = (detail: AuthSessionEventDetail) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(new CustomEvent<AuthSessionEventDetail>(AUTH_SESSION_EVENT, {
    detail,
  }));
};

export const persistAuthSession = (session: AuthSession) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const setStoredAuthSession = (session: AuthSession) => {
  persistAuthSession(session);
  clearLegacyAuthKeys();
  dispatchAuthSessionEvent({
    action: "signed-in",
    session,
  });
};

export const updateStoredAuthUser = (user: AuthUser) => {
  const session = readStoredAuthSession();

  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    user,
  } satisfies AuthSession;

  persistAuthSession(nextSession);
  dispatchAuthSessionEvent({
    action: "updated",
    session: nextSession,
  });

  return nextSession;
};

export const clearStoredAuthSession = (reason: AuthLogoutReason = "logout") => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  clearLegacyAuthKeys();

  dispatchAuthSessionEvent({
    action: "signed-out",
    reason,
    session: null,
  });
};

export const getAccessToken = () => readStoredAuthSession()?.accessToken ?? null;

export const getAuthorizationHeader = () => {
  const accessToken = getAccessToken();

  return accessToken ? `Bearer ${accessToken}` : "";
};

export const buildAuthHeaders = (headers?: HeadersInit) => {
  const nextHeaders = new Headers(headers);
  const authorization = getAuthorizationHeader();

  if (authorization && !nextHeaders.has("Authorization")) {
    nextHeaders.set("Authorization", authorization);
  }

  return nextHeaders;
};

export const fetchWithSession = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
) => {
  const response = await fetch(input, {
    ...init,
    headers: buildAuthHeaders(init.headers),
  });

  if (response.status === 401) {
    clearStoredAuthSession("expired");
  }

  return response;
};

export const subscribeToAuthSessionEvents = (
  listener: (detail: AuthSessionEventDetail) => void,
) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handleSessionEvent = (event: Event) => {
    const customEvent = event as CustomEvent<AuthSessionEventDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(AUTH_SESSION_EVENT, handleSessionEvent);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, handleSessionEvent);
  };
};

export const subscribeToAuthStorage = (listener: () => void) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === AUTH_SESSION_KEY ||
      LEGACY_AUTH_KEYS.includes(
        event.key as (typeof LEGACY_AUTH_KEYS)[number],
      )
    ) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
};
