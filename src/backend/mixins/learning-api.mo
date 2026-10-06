import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/learning";
import ClassTypes "../types/classes";
import Common "../types/common";
import LearningLib "../lib/learning";

mixin (
  accessControlState : AccessControl.AccessControlState,
  classes : Map.Map<Common.ClassId, ClassTypes.Class>,
  classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
  completions : Map.Map<Common.StudentId, [Types.Completion]>,
  countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
  manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
  studentPrincipals : Map.Map<Principal, Common.StudentId>,
) {
  func requireLearningAdmin(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Student-facing guard: any registered signed-in caller (admin or student)
  // may read their dashboard and complete classes. `#user` is satisfied by both
  // `#admin` and `#user` roles, while anonymous and unregistered callers are
  // rejected. Admin-only endpoints keep their own `#admin` guard.
  func requireLearningUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can perform this action");
    };
  };

  // Resolve the studentId a caller is allowed to act on. Admins may act on any
  // student; a student may only act on the record bound to their own principal
  // by `resolveStudent`. Returns null when the caller has no bound student and
  // is not an admin, so ownership is enforced server-side rather than trusting
  // the client-supplied studentId.
  func authorizedStudentId(caller : Principal, requested : Types.StudentId) : ?Types.StudentId {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return ?requested;
    };
    switch (studentPrincipals.get(caller)) {
      case (?bound) { if (bound == requested) { ?bound } else { null } };
      case null { null };
    };
  };

  public query ({ caller }) func getStudentDashboard(studentId : Types.StudentId) : async ?Types.StudentDashboard {
    requireLearningUser(caller);
    switch (authorizedStudentId(caller, studentId)) {
      case (null) { null };
      case (?id) {
        LearningLib.getStudentDashboard(classes, classAccess, completions, countdowns, manualLocks, id);
      };
    };
  };

  public shared ({ caller }) func completeClass(studentId : Types.StudentId, classId : Types.ClassId) : async Types.CompleteResult {
    requireLearningUser(caller);
    switch (authorizedStudentId(caller, studentId)) {
      case (null) { #notAuthorized };
      case (?id) {
        LearningLib.completeClass(classes, classAccess, completions, countdowns, manualLocks, id, classId);
      };
    };
  };

  public shared ({ caller }) func overrideCountdown(studentId : Types.StudentId, classId : Types.ClassId, endsAt : Int) : async Bool {
    requireLearningAdmin(caller);
    LearningLib.overrideCountdown(countdowns, studentId, classId, endsAt);
  };

  public shared ({ caller }) func resetCountdown(studentId : Types.StudentId, classId : Types.ClassId) : async Bool {
    requireLearningAdmin(caller);
    LearningLib.resetCountdown(countdowns, studentId, classId);
  };

  public shared ({ caller }) func setClassLockForStudent(studentId : Types.StudentId, classId : Types.ClassId, locked : Bool) : async Bool {
    requireLearningAdmin(caller);
    LearningLib.setClassLock(manualLocks, studentId, classId, locked);
  };
};
