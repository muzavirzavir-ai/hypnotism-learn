import { KeyKind, createActor } from "@/backend";
import type {
  AccessKind,
  ActiveSession,
  Role,
  SessionToken,
  SignInOutcome,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import {
  type ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "hypnotism.session";
const IDENTIFIER_KEY = "hypnotism.identifier";

export interface SessionContextValue {
  session: ActiveSession | null;
  role: Role | null;
  isRestoring: boolean;
  isSigningIn: boolean;
  signIn: (
    kind: AccessKind,
    key: string,
    identifier?: string,
  ) => Promise<SignInOutcome>;
  signOut: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

function readStoredToken(): SessionToken | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: SessionToken | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable; the in-memory session still works.
  }
}

function readStoredIdentifier(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.sessionStorage.getItem(IDENTIFIER_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStoredIdentifier(identifier: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (identifier) {
      window.sessionStorage.setItem(IDENTIFIER_KEY, identifier);
    } else {
      window.sessionStorage.removeItem(IDENTIFIER_KEY);
    }
  } catch {
    // Storage may be unavailable; the in-memory session still works.
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching } = useActor(createActor);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const restoredRef = useRef(false);

  // Restore a persisted token once the actor is ready.
  useEffect(() => {
    if (!actor || isFetching || restoredRef.current) return;
    restoredRef.current = true;

    const token = readStoredToken();
    if (!token) {
      setIsRestoring(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const view = await actor.getSession(token);
        if (cancelled) return;
        if (view) {
          setSession({
            token,
            role: view.role,
            issuedAt: view.issuedAt,
            identifier: readStoredIdentifier(),
          });
        } else {
          writeStoredToken(null);
          writeStoredIdentifier(null);
        }
      } catch {
        if (!cancelled) {
          writeStoredToken(null);
          writeStoredIdentifier(null);
        }
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const signIn = useCallback(
    async (
      kind: AccessKind,
      key: string,
      identifier?: string,
    ): Promise<SignInOutcome> => {
      if (!actor) {
        return { status: "error", message: "Backend is not ready" };
      }
      setIsSigningIn(true);
      try {
        const result = await actor.verifyAccessKey(
          kind === "admin" ? KeyKind.admin : KeyKind.student,
          key,
        );
        if (result.__kind__ === "ok") {
          const trimmedIdentifier = identifier?.trim() || undefined;
          const next: ActiveSession = {
            token: result.ok.token,
            role: result.ok.role,
            issuedAt: result.ok.issuedAt,
            identifier: trimmedIdentifier,
          };
          setSession(next);
          writeStoredToken(next.token);
          writeStoredIdentifier(trimmedIdentifier ?? null);
          return { status: "ok" };
        }
        if (result.__kind__ === "rateLimited") {
          return {
            status: "rateLimited",
            retryAfterSeconds: Number(result.rateLimited.retryAfterSeconds),
          };
        }
        return { status: "invalidKey" };
      } catch {
        return { status: "error", message: "Unable to reach the server" };
      } finally {
        setIsSigningIn(false);
      }
    },
    [actor],
  );

  const signOut = useCallback(async () => {
    const token = session?.token;
    setSession(null);
    writeStoredToken(null);
    writeStoredIdentifier(null);
    if (actor && token) {
      try {
        await actor.signOut(token);
      } catch {
        // Local sign-out already succeeded; a failed server call is non-blocking.
      }
    }
  }, [actor, session]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      role: session?.role ?? null,
      isRestoring,
      isSigningIn,
      signIn,
      signOut,
    }),
    [session, isRestoring, isSigningIn, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
