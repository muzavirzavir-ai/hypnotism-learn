module {
  public type Timestamp = Int; // nanoseconds since epoch (server time)
  public type ClassId = Nat;
  public type LessonId = Nat;
  public type StudentId = Nat;
  public type MediaId = Nat;
  public type AuditId = Nat;
  public type SessionToken = Text;

  public type Role = {
    #admin;
    #student;
  };

  public type Session = {
    token : SessionToken;
    role : Role;
    issuedAt : Timestamp;
  };

  public type MediaKind = {
    #poster;
    #file;
    #video;
  };

  public type MediaRef = {
    id : MediaId;
    kind : MediaKind;
    name : Text;
    mimeType : Text;
    blob : Blob;
    uploadedAt : Timestamp;
  };

  public type AuditAction = {
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

  public type AuditEntry = {
    id : AuditId;
    action : AuditAction;
    actorPrincipal : Principal;
    detail : Text;
    at : Timestamp;
  };
};
