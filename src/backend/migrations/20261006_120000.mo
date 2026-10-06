import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";

module {
  type Timestamp = Int;
  type ClassId = Nat;
  type LessonId = Nat;
  type StudentId = Nat;
  type MediaId = Nat;
  type AuditId = Nat;
  type SessionToken = Text;

  type Role = { #admin; #student };

  type Session = {
    token : SessionToken;
    role : Role;
    issuedAt : Timestamp;
  };

  type MediaKind = { #poster; #file; #video };

  type MediaRef = {
    id : MediaId;
    kind : MediaKind;
    name : Text;
    mimeType : Text;
    blob : Blob;
    uploadedAt : Timestamp;
  };

  type Class = {
    id : ClassId;
    titleEn : Text;
    titleMl : Text;
    descriptionEn : Text;
    descriptionMl : Text;
    order : Nat;
    published : Bool;
    locked : Bool;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  type Lesson = {
    id : LessonId;
    classId : ClassId;
    titleEn : Text;
    titleMl : Text;
    bodyEn : Text;
    bodyMl : Text;
    order : Nat;
    poster : ?MediaRef;
    files : [MediaRef];
    video : ?MediaRef;
  };

  type Student = {
    id : StudentId;
    name : Text;
    identifier : Text;
    watermarkEnabled : Bool;
    createdAt : Timestamp;
  };

  type Completion = {
    studentId : StudentId;
    classId : ClassId;
    completedAt : Timestamp;
  };

  type Countdown = {
    studentId : StudentId;
    classId : ClassId;
    startedAt : Timestamp;
    endsAt : Timestamp;
    overridden : Bool;
  };

  type AuditAction = {
    #signIn;
    #signOut;
    #failedKey;
    #classCreated;
    #classUpdated;
    #classDeleted;
    #classPublished;
    #classLocked;
    #classUnlocked;
    #lessonChanged;
    #mediaChanged;
    #studentChanged;
    #accessGranted;
    #accessRevoked;
    #countdownOverridden;
    #countdownReset;
    #watermarkToggled;
  };

  type AuditEntry = {
    id : AuditId;
    action : AuditAction;
    actorPrincipal : Principal;
    detail : Text;
    at : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    adminKey : Text;
    studentKey : Text;
    sessions : Map.Map<SessionToken, Session>;
    failedAttempts : Map.Map<Principal, { var count : Nat; var lastAttemptAt : Timestamp }>;
    classes : Map.Map<ClassId, Class>;
    lessons : Map.Map<LessonId, Lesson>;
    state : { var nextClassId : Nat; var nextLessonId : Nat; var nextMediaId : Nat };
    students : Map.Map<StudentId, Student>;
    studentState : { var nextStudentId : Nat };
    classAccess : Map.Map<StudentId, [ClassId]>;
    completions : Map.Map<StudentId, [Completion]>;
    countdowns : Map.Map<StudentId, [Countdown]>;
    manualLocks : Map.Map<StudentId, [ClassId]>;
    studentPrincipals : Map.Map<Principal, StudentId>;
    auditLog : Map.Map<AuditId, AuditEntry>;
    auditState : { var nextAuditId : Nat };
  };

  public func migration(_ : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      adminKey = "88678";
      studentKey = "96637";
      sessions = Map.empty();
      failedAttempts = Map.empty();
      classes = Map.empty();
      lessons = Map.empty();
      state = { var nextClassId = 1; var nextLessonId = 1; var nextMediaId = 1 };
      students = Map.empty();
      studentState = { var nextStudentId = 1 };
      classAccess = Map.empty();
      completions = Map.empty();
      countdowns = Map.empty();
      manualLocks = Map.empty();
      studentPrincipals = Map.empty();
      auditLog = Map.empty();
      auditState = { var nextAuditId = 1 };
    };
  };
};
