import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/learning";
import ClassTypes "../types/classes";
import Common "../types/common";

module {
  let DAY_NANOS : Int = 86_400_000_000_000;

  func isCompleted(
    completions : Map.Map<Common.StudentId, [Types.Completion]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (completions.get(studentId)) {
      case (?list) { list.any(func(c) = c.classId == classId) };
      case null { false };
    };
  };

  func placeholderClass(classId : Types.ClassId) : ClassTypes.Class {
    {
      id = classId;
      titleEn = "";
      titleMl = "";
      descriptionEn = "";
      descriptionMl = "";
      order = 0;
      published = false;
      locked = true;
      createdAt = 0;
      updatedAt = 0;
    };
  };

  func activeCountdown(
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
    now : Int,
  ) : ?Types.Countdown {
    switch (countdowns.get(studentId)) {
      case (?list) { list.find(func(c) = c.classId == classId and c.endsAt > now) };
      case null { null };
    };
  };

  func isManuallyLocked(
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (manualLocks.get(studentId)) {
      case (?list) { list.contains(classId) };
      case null { false };
    };
  };

  func isGranted(
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (classAccess.get(studentId)) {
      case (?list) { list.contains(classId) };
      case null { false };
    };
  };

  // A class is unlocked when it is granted, not manually locked, and no active
  // countdown is running for it. The countdown is derived purely from server time.
  func isUnlocked(
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
    now : Int,
  ) : Bool {
    if (not isGranted(classAccess, studentId, classId)) { return false };
    if (isManuallyLocked(manualLocks, studentId, classId)) { return false };
    switch (activeCountdown(countdowns, studentId, classId, now)) {
      case (?_) { false };
      case null { true };
    };
  };

  public func getStudentDashboard(
    students : Map.Map<Common.StudentId, ClassTypes.Class>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    completions : Map.Map<Common.StudentId, [Types.Completion]>,
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
  ) : ?Types.StudentDashboard {
    let granted = switch (classAccess.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    let now = Time.now();
    let views = granted.map(func(classId) {
      let classInfo = switch (students.get(classId)) {
        case (?c) { c };
        case null { placeholderClass(classId) };
      };
      let active = activeCountdown(countdowns, studentId, classId, now);
      {
        classInfo;
        locked = not isUnlocked(classAccess, countdowns, manualLocks, studentId, classId, now);
        completed = isCompleted(completions, studentId, classId);
        countdownEndsAt = switch (active) { case (?c) { ?c.endsAt }; case null { null } };
        remainingSeconds = switch (active) {
          case (?c) { ((c.endsAt - now) / 1_000_000_000).toNat() };
          case null { 0 };
        };
      };
    });
    let sorted = views.sort(func(a, b) = Nat.compare(a.classInfo.order, b.classInfo.order));
    let completedCount = sorted.filter(func(v) = v.completed).size();
    let activeAny = switch (countdowns.get(studentId)) {
      case (?list) { list.find(func(c) = c.endsAt > now) };
      case null { null };
    };
    ?{
      studentId;
      classes = sorted;
      completedCount;
      totalCount = sorted.size();
      currentCountdownEndsAt = switch (activeAny) { case (?c) { ?c.endsAt }; case null { null } };
      remainingSeconds = switch (activeAny) {
        case (?c) { ((c.endsAt - now) / 1_000_000_000).toNat() };
        case null { 0 };
      };
    };
  };

  public func completeClass(
    classes : Map.Map<Common.ClassId, ClassTypes.Class>,
    classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
    completions : Map.Map<Common.StudentId, [Types.Completion]>,
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Types.CompleteResult {
    if (not isGranted(classAccess, studentId, classId)) {
      return #notAuthorized;
    };
    if (isCompleted(completions, studentId, classId)) {
      return #alreadyCompleted;
    };
    let now = Time.now();
    let existing = switch (completions.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    let completion : Types.Completion = { studentId; classId; completedAt = now };
    completions.add(studentId, existing.concat([completion]));

    let endsAt = now + DAY_NANOS;
    let countdown : Types.Countdown = {
      studentId;
      classId;
      startedAt = now;
      endsAt;
      overridden = false;
    };
    let existingCountdowns = switch (countdowns.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    let withoutThis = existingCountdowns.filter(func(c) = c.classId != classId);
    countdowns.add(studentId, withoutThis.concat([countdown]));

    // The next authorized class is the lowest-ordered granted class after this one.
    let granted = switch (classAccess.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    let currentOrder = switch (classes.get(classId)) {
      case (?c) { c.order };
      case null { 0 };
    };
    let nextCandidates = granted
      .filter(func(c) = switch (classes.get(c)) {
        case (?info) { info.order > currentOrder };
        case null { false };
      })
      .sort(func(a, b) = switch (classes.get(a), classes.get(b)) {
        case (?ca, ?cb) { Nat.compare(ca.order, cb.order) };
        case _ { #equal };
      });
    let nextClassId = if (nextCandidates.size() > 0) { ?nextCandidates[0] } else { null };
    ignore manualLocks;
    #ok({ countdownEndsAt = endsAt; nextClassId });
  };

  public func overrideCountdown(
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
    endsAt : Int,
  ) : Bool {
    switch (countdowns.get(studentId)) {
      case (?list) {
        let target = list.find(func(c) = c.classId == classId);
        switch (target) {
          case (?c) {
            let updated : Types.Countdown = {
              studentId = c.studentId;
              classId = c.classId;
              startedAt = c.startedAt;
              endsAt;
              overridden = true;
            };
            let rebuilt = list.map(func(x) = if (x.classId == classId) { updated } else { x });
            countdowns.add(studentId, rebuilt);
            true;
          };
          case null { false };
        };
      };
      case null { false };
    };
  };

  public func resetCountdown(
    countdowns : Map.Map<Common.StudentId, [Types.Countdown]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
  ) : Bool {
    switch (countdowns.get(studentId)) {
      case (?list) {
        if (not list.any(func(c) = c.classId == classId)) {
          false;
        } else {
          countdowns.add(studentId, list.filter(func(c) = c.classId != classId));
          true;
        };
      };
      case null { false };
    };
  };

  public func setClassLock(
    manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>,
    studentId : Types.StudentId,
    classId : Types.ClassId,
    locked : Bool,
  ) : Bool {
    let current = switch (manualLocks.get(studentId)) {
      case (?list) { list };
      case null { [] };
    };
    if (locked) {
      if (current.contains(classId)) { false } else {
        manualLocks.add(studentId, current.concat([classId]));
        true;
      };
    } else {
      if (not current.contains(classId)) { false } else {
        manualLocks.add(studentId, current.filter(func(c) = c != classId));
        true;
      };
    };
  };
};
