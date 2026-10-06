import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AuditEntry {
    at: Timestamp;
    id: AuditId;
    action: AuditAction;
    detail: string;
    actorPrincipal: Principal;
}
export type AuditId = bigint;
export interface Cell {
    value: Value;
    name: string;
}
export interface Class {
    id: ClassId;
    descriptionEn: string;
    descriptionMl: string;
    order: bigint;
    published: boolean;
    createdAt: Timestamp;
    locked: boolean;
    updatedAt: Timestamp;
    titleEn: string;
    titleMl: string;
}
export type ClassId = bigint;
export interface ClassInput {
    descriptionEn: string;
    descriptionMl: string;
    published: boolean;
    titleEn: string;
    titleMl: string;
}
export type CompleteResult = {
    __kind__: "ok";
    ok: {
        nextClassId?: ClassId;
        countdownEndsAt: Timestamp;
    };
} | {
    __kind__: "notAuthorized";
    notAuthorized: null;
} | {
    __kind__: "alreadyCompleted";
    alreadyCompleted: null;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Lesson {
    id: LessonId;
    files: Array<MediaRef>;
    order: bigint;
    video?: MediaRef;
    bodyEn: string;
    bodyMl: string;
    classId: ClassId;
    titleEn: string;
    titleMl: string;
    poster?: MediaRef;
}
export type LessonId = bigint;
export interface LessonInput {
    bodyEn: string;
    bodyMl: string;
    classId: ClassId;
    titleEn: string;
    titleMl: string;
}
export type MediaId = bigint;
export interface MediaRef {
    id: MediaId;
    blob: Uint8Array;
    kind: MediaKind;
    name: string;
    mimeType: string;
    uploadedAt: Timestamp;
}
export interface Progress {
    studentId: StudentId;
    currentClassId?: ClassId;
    completedClasses: Array<ClassId>;
    countdownEndsAt?: Timestamp;
    remainingSeconds: bigint;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface Session {
    token: SessionToken;
    role: Role;
    issuedAt: Timestamp;
}
export type SessionToken = string;
export interface SessionView {
    role: Role;
    issuedAt: Timestamp;
}
export interface Student {
    id: StudentId;
    name: string;
    createdAt: Timestamp;
    identifier: string;
    watermarkEnabled: boolean;
}
export interface StudentClassView {
    completed: boolean;
    locked: boolean;
    countdownEndsAt?: Timestamp;
    remainingSeconds: bigint;
    classInfo: Class;
}
export interface StudentDashboard {
    studentId: StudentId;
    totalCount: bigint;
    classes: Array<StudentClassView>;
    completedCount: bigint;
    remainingSeconds: bigint;
    currentCountdownEndsAt?: Timestamp;
}
export type StudentId = bigint;
export interface StudentInput {
    name: string;
    identifier: string;
}
export interface StudentSelfView {
    id: StudentId;
    name: string;
    identifier: string;
    watermarkEnabled: boolean;
}
export interface StudentView {
    progress: Progress;
    grantedClasses: Array<ClassId>;
    student: Student;
}
export type Timestamp = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type VerifyResult = {
    __kind__: "ok";
    ok: Session;
} | {
    __kind__: "invalidKey";
    invalidKey: null;
} | {
    __kind__: "rateLimited";
    rateLimited: {
        retryAfterSeconds: bigint;
    };
};
export enum AuditAction {
    countdownOverridden = "countdownOverridden",
    countdownReset = "countdownReset",
    watermarkToggled = "watermarkToggled",
    signOut = "signOut",
    accessGranted = "accessGranted",
    lessonChanged = "lessonChanged",
    failedKey = "failedKey",
    studentChanged = "studentChanged",
    classUpdated = "classUpdated",
    signIn = "signIn",
    mediaChanged = "mediaChanged",
    classPublished = "classPublished",
    classLocked = "classLocked",
    classUnlocked = "classUnlocked",
    accessRevoked = "accessRevoked",
    classCreated = "classCreated",
    classDeleted = "classDeleted"
}
export enum KeyKind {
    admin = "admin",
    student = "student"
}
export enum MediaKind {
    video = "video",
    file = "file",
    poster = "poster"
}
export enum Role {
    admin = "admin",
    student = "student"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    attachLessonMedia(lessonId: LessonId, kind: MediaKind, name: string, mimeType: string, blob: Uint8Array): Promise<Lesson | null>;
    completeClass(studentId: StudentId, classId: ClassId): Promise<CompleteResult>;
    createClass(input: ClassInput): Promise<Class>;
    createLesson(input: LessonInput): Promise<Lesson>;
    createStudent(input: StudentInput): Promise<Student>;
    deleteClass(id: ClassId): Promise<boolean>;
    deleteLesson(id: LessonId): Promise<boolean>;
    deleteStudent(id: StudentId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getAuthorizedLessonMedia(token: SessionToken, studentId: StudentId, lessonId: LessonId): Promise<Lesson | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClass(id: ClassId): Promise<Class | null>;
    getSession(token: SessionToken): Promise<SessionView | null>;
    getStudent(id: StudentId): Promise<StudentView | null>;
    getStudentDashboard(studentId: StudentId): Promise<StudentDashboard | null>;
    grantClassAccess(studentId: StudentId, classId: ClassId): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listAudit(limit: bigint): Promise<Array<AuditEntry>>;
    listClasses(): Promise<Array<Class>>;
    listLessons(classId: ClassId): Promise<Array<Lesson>>;
    listStudents(): Promise<Array<StudentView>>;
    overrideCountdown(studentId: StudentId, classId: ClassId, endsAt: bigint): Promise<boolean>;
    removeLessonMedia(lessonId: LessonId, mediaId: MediaId): Promise<Lesson | null>;
    reorderClasses(orderedIds: Array<ClassId>): Promise<void>;
    resetCountdown(studentId: StudentId, classId: ClassId): Promise<boolean>;
    resolveStudent(identifier: string): Promise<StudentSelfView | null>;
    revokeClassAccess(studentId: StudentId, classId: ClassId): Promise<boolean>;
    schema(): Promise<string>;
    setClassLockForStudent(studentId: StudentId, classId: ClassId, locked: boolean): Promise<boolean>;
    setClassLocked(id: ClassId, locked: boolean): Promise<Class | null>;
    setClassPublished(id: ClassId, published: boolean): Promise<Class | null>;
    setStudentWatermark(studentId: StudentId, enabled: boolean): Promise<Student | null>;
    signOut(token: SessionToken): Promise<void>;
    updateClass(id: ClassId, input: ClassInput): Promise<Class | null>;
    updateLesson(id: LessonId, input: LessonInput): Promise<Lesson | null>;
    updateStudent(id: StudentId, input: StudentInput): Promise<Student | null>;
    verifyAccessKey(kind: KeyKind, key: string): Promise<VerifyResult>;
}
