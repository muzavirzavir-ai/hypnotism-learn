import type {
  AuditAction,
  AuditEntry,
  Class,
  ClassId,
  ClassInput,
  CompleteResult,
  Lesson,
  LessonId,
  LessonInput,
  MediaKind,
  MediaRef,
  Role,
  Session,
  SessionToken,
  SessionView,
  Student,
  StudentClassView,
  StudentDashboard,
  StudentId,
  StudentInput,
  StudentSelfView,
  StudentView,
  Timestamp,
  VerifyResult,
} from "@/backend";

export type {
  AuditAction,
  AuditEntry,
  Class,
  ClassId,
  ClassInput,
  CompleteResult,
  Lesson,
  LessonId,
  LessonInput,
  MediaKind,
  MediaRef,
  Role,
  Session,
  SessionToken,
  SessionView,
  Student,
  StudentClassView,
  StudentDashboard,
  StudentId,
  StudentInput,
  StudentSelfView,
  StudentView,
  Timestamp,
  VerifyResult,
};

/** The two access-key kinds accepted by `verifyAccessKey`. */
export type AccessKind = "student" | "admin";

/** A restored or freshly created session held by `SessionContext`. */
export interface ActiveSession {
  token: SessionToken;
  role: Role;
  issuedAt: Timestamp;
  /**
   * The student identifier entered at sign-in. Persisted so student-facing
   * calls can resolve the caller's own record via `resolveStudent` after a
   * refresh. Absent for admin sessions.
   */
  identifier?: string;
}

/** Result of a sign-in attempt, surfaced to the calling form. */
export type SignInOutcome =
  | { status: "ok" }
  | { status: "invalidKey" }
  | { status: "rateLimited"; retryAfterSeconds: number }
  | { status: "error"; message: string };

/** Language codes supported by the bilingual UI. */
export type Language = "en" | "ml";
