import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/students";
import LearningTypes "../types/learning";
import Common "../types/common";

module {
  public type State = {
    var nextStudentId : Nat;
  };

  func buildProgress(
    studentId : Types.StudentId,
    completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>,
    countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>,
  ) : Types.Progress {
    let completed = switch (completions.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    let completedClasses = completed.map(func(c) = c.classId);
    let now = Time.now();
    let active = switch (countdowns.get(studentId)) {
      case (?list) { list.find(func(c) = c.endsAt > now) };
      case null { null };
    };
    switch (active) {
      case (?c) {
        {
          studentId;
          completedClasses;
          currentClassId = ?c.classId;
          countdownEndsAt = ?c.endsAt;
          remainingSeconds = ((c.endsAt - now) / 1_000_000_000).toNat();
        };
      };
      case null {
        {
          studentId;
          completedClasses;
          currentClassId = null;
          countdownEndsAt = null;
          remainingSeconds = 0;
        };
      };
    };
  };

  public func listStudents(
    students : Map.Map<Common.StudentId, Types.Student>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>,
    countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>,
  ) : [Types.StudentView] {
    students.values().toArray().map(func(s) = {
      student = s;
      grantedClasses = switch (classAccess.get(s.id)) {
        case (?list) { list };
        case null { [] };
      };
      progress = buildProgress(s.id, completions, countdowns);
    });
  };

  public func getStudent(
    students : Map.Map<Common.StudentId, Types.Student>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>,
    countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>,
    id : Types.StudentId,
  ) : ?Types.StudentView {
    switch (students.get(id)) {
      case (?s) {
        ?{
          student = s;
          grantedClasses = switch (classAccess.get(id)) {
            case (?list) { list };
            case null { [] };
          };
          progress = buildProgress(id, completions, countdowns);
        };
      };
      case null { null };
    };
  };

  // Resolve the caller's own student record from the identifier they entered at
  // sign-in, and bind that student to the caller's principal so later
  // student-facing calls can enforce ownership without trusting a client-supplied
  // studentId. Returns null when no student matches the identifier.
  public func resolveStudent(
    students : Map.Map<Common.StudentId, Types.Student>,
    studentPrincipals : Map.Map<Principal, Common.StudentId>,
    caller : Principal,
    identifier : Text,
  ) : ?Types.StudentSelfView {
    let trimmed = identifier.trim(#char ' ');
    let match = students.values().find(func(s) = s.identifier == trimmed);
    switch (match) {
      case (?s) {
        studentPrincipals.add(caller, s.id);
        ?{ id = s.id; name = s.name; identifier = s.identifier; watermarkEnabled = s.watermarkEnabled };
      };
      case null { null };
    };
  };

  // The studentId bound to the caller's principal, if any.
  public func boundStudentId(
    studentPrincipals : Map.Map<Principal, Common.StudentId>,
    caller : Principal,
  ) : ?Common.StudentId {
    studentPrincipals.get(caller);
  };

  public func createStudent(
    students : Map.Map<Common.StudentId, Types.Student>,
    state : State,
    input : Types.StudentInput,
  ) : Types.Student {
    let id = state.nextStudentId;
    state.nextStudentId := id + 1;
    let created : Types.Student = {
      id;
      name = input.name;
      identifier = input.identifier;
      watermarkEnabled = false;
      createdAt = Time.now();
    };
    students.add(id, created);
    created;
  };

  public func updateStudent(
    students : Map.Map<Common.StudentId, Types.Student>,
    id : Types.StudentId,
    input : Types.StudentInput,
  ) : ?Types.Student {
    switch (students.get(id)) {
      case (?existing) {
        let updated : Types.Student = {
          id = existing.id;
          name = input.name;
          identifier = input.identifier;
          watermarkEnabled = existing.watermarkEnabled;
          createdAt = existing.createdAt;
        };
        students.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };

  public func deleteStudent(
    students : Map.Map<Common.StudentId, Types.Student>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>,
    countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>,
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    id : Types.StudentId,
  ) : Bool {
    switch (students.get(id)) {
      case (?_) {
        students.remove(id);
        classAccess.remove(id);
        completions.remove(id);
        countdowns.remove(id);
        manualLocks.remove(id);
        true;
      };
      case null { false };
    };
  };

  public func grantClassAccess(
    students : Map.Map<Common.StudentId, Types.Student>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (students.get(studentId)) {
      case (?_) {
        let current = switch (classAccess.get(studentId)) {
          case (?list) { list };
          case null { [] };
        };
        if (current.contains(classId)) {
          false;
        } else {
          classAccess.add(studentId, current.concat([classId]));
          true;
        };
      };
      case null { false };
    };
  };

  public func revokeClassAccess(
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (classAccess.get(studentId)) {
      case (?current) {
        if (not current.contains(classId)) {
          false;
        } else {
          classAccess.add(studentId, current.filter(func(c) = c != classId));
          true;
        };
      };
      case null { false };
    };
  };

  public func setWatermark(
    students : Map.Map<Common.StudentId, Types.Student>,
    id : Types.StudentId,
    enabled : Bool,
  ) : ?Types.Student {
    switch (students.get(id)) {
      case (?existing) {
        let updated : Types.Student = {
          id = existing.id;
          name = existing.name;
          identifier = existing.identifier;
          watermarkEnabled = enabled;
          createdAt = existing.createdAt;
        };
        students.add(id, updated);
        ?updated;
      };
      case null { null };
    };
  };
};
