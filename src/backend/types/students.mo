import Common "common";

module {
  public type StudentId = Common.StudentId;
  public type ClassId = Common.ClassId;

  public type Student = {
    id : StudentId;
    name : Text;
    identifier : Text;
    watermarkEnabled : Bool;
    createdAt : Common.Timestamp;
  };

  public type StudentInput = {
    name : Text;
    identifier : Text;
  };

  public type Progress = {
    studentId : StudentId;
    completedClasses : [ClassId];
    currentClassId : ?ClassId;
    countdownEndsAt : ?Common.Timestamp;
    remainingSeconds : Nat;
  };

  public type StudentView = {
    student : Student;
    grantedClasses : [ClassId];
    progress : Progress;
  };

  // Student-facing view of the caller's own record. Exposes only the fields a
  // student needs to render their dashboard and honor the watermark toggle.
  public type StudentSelfView = {
    id : StudentId;
    name : Text;
    identifier : Text;
    watermarkEnabled : Bool;
  };
};
