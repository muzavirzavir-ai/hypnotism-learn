mixin () {
  public query func getApiDoc() : async Text {
    "# HYPNOTISM Backend API\n\n" #
    "Bilingual (English/Malayalam) learning platform backend. Manages classes, lessons, " #
    "private media, students, per-class access grants, and a server-time 24-hour class " #
    "unlock countdown.\n\n" #
    "## Authentication and authorization\n\n" #
    "The app uses Internet Identity. Anonymous principals are guests. The first " #
    "authenticated caller to sign in becomes admin; subsequent callers are users. " #
    "A caller that never signed in through the app frontend is unregistered and is " #
    "treated as a guest even if it belongs to the app owner.\n\n" #
    "The frontend pins an Internet Identity derivation origin, published at " #
    "`/.well-known/ii-derivation-origin` when available. An agent already holding the " #
    "user's Internet Identity authorization derives the correct per-app principal " #
    "against that origin (for example `icp identity link web <name> --app <host>`). " #
    "Such a delegation acts with the user's full authority in this app until it expires.\n\n" #
    "Admin-only endpoints trap with `Unauthorized: Only admins can perform this action` " #
    "for non-admin callers. Student-facing endpoints trap with " #
    "`Unauthorized: Only signed-in users can perform this action` for guests.\n\n" #
    "## Access keys and sessions\n\n" #
    "Access keys are held only in backend state and are never returned to the " #
    "frontend. The frontend sends the entered key to the backend and receives a " #
    "session token and role back.\n\n" #
    "- `verifyAccessKey(kind, key) : VerifyResult` — update. `kind` is `#admin` or " #
    "`#student`. Returns `#ok(session)` with `{ token; role; issuedAt }` on success, " #
    "`#invalidKey` on a wrong key, or `#rateLimited({ retryAfterSeconds })` after 5 " #
    "consecutive failures from the same caller principal, for a 60-second window " #
    "measured against server time. A successful verification clears the caller's " #
    "failure counter. Every attempt is recorded in the audit log.\n" #
    "- `getSession(token) : ?SessionView` — query. Returns `{ role; issuedAt }` for a " #
    "valid token, or `null` if the token is unknown or was signed out. Sessions " #
    "persist across page refresh because they live in backend state.\n" #
    "- `signOut(token) : ()` — update. Removes the session; subsequent `getSession` " #
    "calls for that token return `null`. Signing out an unknown token is a no-op.\n\n" #
    "## Classes and lessons (admin-only mutations)\n\n" #
    "- `listClasses() : [Class]` — query, public. Classes sorted by `order`.\n" #
    "- `getClass(id) : ?Class` — query, public.\n" #
    "- `createClass(input) : Class` — admin. Appends at the end of the sequence.\n" #
    "- `updateClass(id, input) : ?Class` — admin.\n" #
    "- `deleteClass(id) : Bool` — admin. Also deletes the class's lessons.\n" #
    "- `setClassPublished(id, published) : ?Class` — admin.\n" #
    "- `setClassLocked(id, locked) : ?Class` — admin. Global class lock.\n" #
    "- `reorderClasses(orderedIds) : ()` — admin. Assigns order 1..n in the given order.\n" #
    "- `listLessons(classId) : [Lesson]` — query, public. Sorted by `order`.\n" #
    "- `createLesson(input) : Lesson` — admin.\n" #
    "- `updateLesson(id, input) : ?Lesson` — admin.\n" #
    "- `deleteLesson(id) : Bool` — admin.\n" #
    "- `attachLessonMedia(lessonId, kind, name, mimeType, blob) : ?Lesson` — admin. " #
    "`kind` is `#poster`, `#file`, or `#video`. A poster/video replaces the existing " #
    "one; files append.\n" #
    "- `removeLessonMedia(lessonId, mediaId) : ?Lesson` — admin.\n\n" #
    "## Private media delivery\n\n" #
    "Media blobs (posters, files, videos) are stored privately and are never exposed " #
    "through a public URL or a permanent link. There is no download endpoint.\n\n" #
    "- `getAuthorizedLessonMedia(token, studentId, lessonId) : ?Lesson` — query. " #
    "Returns the lesson (including its media blobs) only when the caller is an admin, " #
    "or a student holding a valid session `token` who has been granted access to the " #
    "class that owns the lesson. Any other caller receives `null`. The frontend must " #
    "request media per view; access is re-checked on every call against the student's " #
    "current class grants, so revoking access takes effect immediately.\n\n" #
    "## Students and access\n\n" #
    "- `resolveStudent(identifier) : ?StudentSelfView` — signed-in users. Resolves " #
    "the caller's own student record from the identifier they entered at sign-in " #
    "and binds that student to the caller's principal. Returns " #
    "`{ id; name; identifier; watermarkEnabled }`, or `null` when no student matches. " #
    "Guests trap with `Unauthorized: Only signed-in users can perform this action`. " #
    "This is the student-facing way to obtain the caller's own `studentId` and " #
    "watermark setting; the admin-only `listStudents`/`getStudent` are not callable " #
    "by students.\n" #
    "- `listStudents() : [StudentView]` — admin query.\n" #
    "- `getStudent(id) : ?StudentView` — admin query.\n" #
    "- `createStudent(input) : Student` — admin.\n" #
    "- `updateStudent(id, input) : ?Student` — admin.\n" #
    "- `deleteStudent(id) : Bool` — admin. Removes the student's access, completions, " #
    "countdowns, and manual locks.\n" #
    "- `grantClassAccess(studentId, classId) : Bool` — admin. Returns false if already granted.\n" #
    "- `revokeClassAccess(studentId, classId) : Bool` — admin. Returns false if not granted.\n" #
    "- `setStudentWatermark(studentId, enabled) : ?Student` — admin.\n\n" #
    "## Learning and countdown\n\n" #
    "- `getStudentDashboard(studentId) : ?StudentDashboard` — signed-in users. Returns " #
    "granted classes in sequence with `locked`, `completed`, and remaining countdown " #
    "seconds. `remainingSeconds` is derived from server time. Ownership is enforced " #
    "server-side: a student may only read the record bound to their own principal by " #
    "`resolveStudent`; passing another student's id returns `null`. Admins may read any " #
    "student's dashboard.\n" #
    "- `completeClass(studentId, classId) : CompleteResult` — signed-in users. Records " #
    "completion server-side and starts a 24-hour countdown from `Time.now()`. Returns " #
    "`#ok { countdownEndsAt; nextClassId }`, `#notAuthorized` if the class is not " #
    "granted or the caller does not own the student record, or `#alreadyCompleted` if " #
    "already completed. Re-calling for an already completed class is safe and returns " #
    "`#alreadyCompleted`. A student may only complete classes for the record bound to " #
    "their own principal; admins may act on any student.\n" #
    "- `overrideCountdown(studentId, classId, endsAt) : Bool` — admin. Sets the " #
    "countdown end to an absolute server-time timestamp (nanoseconds since epoch).\n" #
    "- `resetCountdown(studentId, classId) : Bool` — admin. Removes the countdown, " #
    "unlocking the class immediately.\n" #
    "- `setClassLockForStudent(studentId, classId, locked) : Bool` — admin. Manual " #
    "per-student lock overriding the automatic countdown.\n\n" #
    "## Units and encodings\n\n" #
    "All timestamps are `Int` nanoseconds since the Unix epoch, from server time. " #
    "`remainingSeconds` is a `Nat` derived from server time; changing a device clock " #
    "cannot affect it. IDs are `Nat`. Media blobs are returned inline in lesson records.\n\n" #
    "## Audit\n\n" #
    "- `listAudit(limit) : [AuditEntry]` — admin query. Returns up to `limit` audit " #
    "entries, most recent first. Each entry is `{ id; action; actorPrincipal; detail; " #
    "at }` where `at` is server time in nanoseconds. Recorded actions include sign-in, " #
    "sign-out, failed key attempts, class and lesson changes, media changes, student " #
    "changes, access grants and revocations, countdown overrides and resets, and " #
    "watermark toggles. Non-admin callers trap with " #
    "`Unauthorized: Only admins can perform this action`.\n\n" #
    "## Query layer (OQL)\n\n" #
    "The canister exposes a read-only Object Query Layer for the Caffeine Data " #
    "Intelligence agent: `schema() : Text` and `execute(queryJson) : Text`. Both are " #
    "queries and never mutate state. Authorization is enforced per table against the " #
    "live caller:\n\n" #
    "- `class` and `lesson` — public. Anyone, including anonymous callers, may read " #
    "the class catalogue and lesson text. Lesson media blobs are never exposed; only " #
    "`hasPoster`, `hasVideo`, and `fileCount` flags are queryable.\n" #
    "- `student`, `classAccess`, `completion`, `countdown`, `manualLock`, and " #
    "`auditEntry` — controller-only. Only the platform controller (the Data " #
    "Intelligence agent) reads these; end users cannot query them directly.\n\n" #
    "Tables and their columns:\n\n" #
    "- `class`: `id`, `titleEn`, `titleMl`, `descriptionEn`, `descriptionMl`, " #
    "`order`, `published`, `locked`, `createdAt`, `updatedAt`.\n" #
    "- `lesson`: `id`, `classId` (edge to `class`), `titleEn`, `titleMl`, `bodyEn`, " #
    "`bodyMl`, `order`, `hasPoster`, `fileCount`, `hasVideo`.\n" #
    "- `student`: `id`, `name`, `identifier`, `watermarkEnabled`, `createdAt`.\n" #
    "- `classAccess`: `id`, `studentId` (edge to `student`), `classId` (edge to " #
    "`class`), `grantedAt`.\n" #
    "- `completion`: `id`, `studentId` (edge), `classId` (edge), `completedAt`.\n" #
    "- `countdown`: `id`, `studentId` (edge), `classId` (edge), `startedAt`, " #
    "`endsAt`, `overridden`.\n" #
    "- `manualLock`: `id`, `studentId` (edge), `classId` (edge).\n" #
    "- `auditEntry`: `id`, `action` (tag text), `actorPrincipal`, `detail`, `at`.\n\n" #
    "Timestamps in the query layer are `Int` nanoseconds since the Unix epoch, from " #
    "server time. `id` values for the join tables are synthetic `\"<studentId>:<classId>\"` " #
    "strings. The query layer is read-only; all mutations go through the endpoints " #
    "above.\n";
  };
};
