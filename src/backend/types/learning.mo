import Common "common";
import Classes "classes";

module {
  public type ClassId = Common.ClassId;
  public type StudentId = Common.StudentId;

  public type ClassAccess = {
    studentId : StudentId;
    classId : ClassId;
    grantedAt : Common.Timestamp;
  };

  public type Completion = {
    studentId : StudentId;
    classId : ClassId;
    completedAt : Common.Timestamp;
  };

  public type Countdown = {
    studentId : StudentId;
    classId : ClassId;
    startedAt : Common.Timestamp;
    endsAt : Common.Timestamp;
    overridden : Bool;
  };

  public type StudentClassView = {
    classInfo : Classes.Class;
    locked : Bool;
    completed : Bool;
    countdownEndsAt : ?Common.Timestamp;
    remainingSeconds : Nat;
  };

  public type StudentDashboard = {
    studentId : StudentId;
    classes : [StudentClassView];
    completedCount : Nat;
    totalCount : Nat;
    currentCountdownEndsAt : ?Common.Timestamp;
    remainingSeconds : Nat;
  };

  public type CompleteResult = {
    #ok : { countdownEndsAt : Common.Timestamp; nextClassId : ?ClassId };
    #notAuthorized;
    #alreadyCompleted;
  };
};
