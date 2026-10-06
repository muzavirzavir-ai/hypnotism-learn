import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/students";
import LearningTypes "../types/learning";
import Common "../types/common";
import StudentsLib "../lib/students";

mixin (
  accessControlState : AccessControl.AccessControlState,
  students : Map.Map<Common.StudentId, Types.Student>,
  studentState : StudentsLib.State,
  classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
  completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>,
  countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>,
  manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
  studentPrincipals : Map.Map<Principal, Common.StudentId>,
) {
  func requireStudentsAdmin(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  // Student-facing guard: any registered signed-in caller (admin or student)
  // may resolve their own record. Anonymous and unregistered callers are rejected.
  func requireStudentsUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only signed-in users can perform this action");
    };
  };

  // Resolve the signed-in caller's own student record from the identifier they
  // entered at sign-in. Binds the resolved student to the caller's principal so
  // the learning endpoints can enforce ownership. Returns null when no student
  // matches the identifier.
  public shared ({ caller }) func resolveStudent(identifier : Text) : async ?Types.StudentSelfView {
    requireStudentsUser(caller);
    StudentsLib.resolveStudent(students, studentPrincipals, caller, identifier);
  };

  public query ({ caller }) func listStudents() : async [Types.StudentView] {
    requireStudentsAdmin(caller);
    StudentsLib.listStudents(students, classAccess, completions, countdowns);
  };

  public query ({ caller }) func getStudent(id : Types.StudentId) : async ?Types.StudentView {
    requireStudentsAdmin(caller);
    StudentsLib.getStudent(students, classAccess, completions, countdowns, id);
  };

  public shared ({ caller }) func createStudent(input : Types.StudentInput) : async Types.Student {
    requireStudentsAdmin(caller);
    StudentsLib.createStudent(students, studentState, input);
  };

  public shared ({ caller }) func updateStudent(id : Types.StudentId, input : Types.StudentInput) : async ?Types.Student {
    requireStudentsAdmin(caller);
    StudentsLib.updateStudent(students, id, input);
  };

  public shared ({ caller }) func deleteStudent(id : Types.StudentId) : async Bool {
    requireStudentsAdmin(caller);
    StudentsLib.deleteStudent(students, classAccess, completions, countdowns, manualLocks, id);
  };


  public shared ({ caller }) func grantClassAccess(studentId : Types.StudentId, classId : Types.ClassId) : async Bool {
    requireStudentsAdmin(caller);
    StudentsLib.grantClassAccess(students, classAccess, studentId, classId);
  };

  public shared ({ caller }) func revokeClassAccess(studentId : Types.StudentId, classId : Types.ClassId) : async Bool {
    requireStudentsAdmin(caller);
    StudentsLib.revokeClassAccess(classAccess, studentId, classId);
  };

  public shared ({ caller }) func setStudentWatermark(studentId : Types.StudentId, enabled : Bool) : async ?Types.Student {
    requireStudentsAdmin(caller);
    StudentsLib.setWatermark(students, studentId, enabled);
  };
};
