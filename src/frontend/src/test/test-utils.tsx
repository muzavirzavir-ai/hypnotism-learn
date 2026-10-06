import type { Backend } from "@/backend";
import { LanguageProvider } from "@/context/LanguageContext";
import { SessionProvider } from "@/context/SessionContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { vi } from "vitest";

/**
 * A typed stand-in for the generated `Backend` actor. Every method is a
 * `vi.fn()` so a test can assert the exact call the UI made, and the object is
 * cast to `Backend` so the app's own types constrain what a test may stub.
 *
 * This is a local mock: it never reaches a canister. Backend behavior is
 * covered separately by the PocketIC lane under `app/test/pocketic/`.
 */
export type MockBackend = {
  [K in keyof Backend]: Backend[K] extends (...args: infer A) => infer R
    ? ReturnType<typeof vi.fn<(...args: A) => R>>
    : never;
};

/** Build a fully-stubbed backend actor with sensible empty-state defaults. */
export function createMockBackend(
  overrides: Partial<MockBackend> = {},
): MockBackend {
  const base = {
    verifyAccessKey: vi.fn(),
    getSession: vi.fn().mockResolvedValue(null),
    signOut: vi.fn().mockResolvedValue(undefined),
    resolveStudent: vi.fn().mockResolvedValue(null),
    getStudentDashboard: vi.fn().mockResolvedValue(null),
    listClasses: vi.fn().mockResolvedValue([]),
    getClass: vi.fn().mockResolvedValue(null),
    listLessons: vi.fn().mockResolvedValue([]),
    getAuthorizedLessonMedia: vi.fn().mockResolvedValue(null),
    completeClass: vi.fn(),
    listStudents: vi.fn().mockResolvedValue([]),
    listAudit: vi.fn().mockResolvedValue([]),
    createClass: vi.fn(),
    updateClass: vi.fn(),
    deleteClass: vi.fn(),
    setClassPublished: vi.fn(),
    setClassLocked: vi.fn(),
    reorderClasses: vi.fn(),
    createLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    attachLessonMedia: vi.fn(),
    removeLessonMedia: vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
    grantClassAccess: vi.fn(),
    revokeClassAccess: vi.fn(),
    setStudentWatermark: vi.fn(),
    setClassLockForStudent: vi.fn(),
    overrideCountdown: vi.fn(),
    resetCountdown: vi.fn(),
    isCallerAdmin: vi.fn().mockResolvedValue(false),
    getCallerUserRole: vi.fn().mockResolvedValue("guest"),
    assignCallerUserRole: vi.fn(),
    execute: vi.fn(),
    schema: vi.fn(),
    getApiDoc: vi.fn(),
    _initialize_access_control: vi.fn(),
    _internet_identity_sign_in_start: vi.fn(),
    _internet_identity_sign_in_finish: vi.fn(),
    _immutableObjectStorageBlobsAreLive: vi.fn(),
    _immutableObjectStorageBlobsToDelete: vi.fn(),
    _immutableObjectStorageConfirmBlobDeletion: vi.fn(),
    _immutableObjectStorageCreateCertificate: vi.fn(),
    _immutableObjectStorageRefillCashier: vi.fn(),
    _immutableObjectStorageUpdateGatewayPrincipals: vi.fn(),
  } as unknown as MockBackend;
  return Object.assign(base, overrides);
}

/**
 * Mutable holder for the actor a test wants `useActor` to return. A test file
 * declares the module mock at its own top level (Vitest only hoists a
 * top-level `vi.mock` call) and reads this holder inside the factory:
 *
 * ```ts
 * vi.mock("@caffeineai/core-infrastructure", async (importOriginal) => {
 *   const actual = await importOriginal<typeof import("@caffeineai/core-infrastructure")>();
 *   return { ...actual, useActor: () => ({ actor: mockActorState.actor, isFetching: false }) };
 * });
 * ```
 */
export const mockActorState: { actor: MockBackend | null } = { actor: null };

/** Set the actor the mocked `useActor` returns for the current test. */
export function setMockActor(actor: MockBackend | null): void {
  mockActorState.actor = actor;
}

/** A fresh QueryClient with retries disabled so failures surface immediately. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProviderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

/**
 * Render a component inside the app's real providers (language, session,
 * query client) with a local actor mock. The session provider reads the actor
 * from the mocked `useActor`, so tests control sign-in state through the mock.
 */
export function renderWithProviders(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...options }: ProviderOptions = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <SessionProvider>{children}</SessionProvider>
        </LanguageProvider>
      </QueryClientProvider>
    );
  }
  return { queryClient, ...render(ui, { wrapper: Wrapper, ...options }) };
}
