import Common "../types/common";
import Classes "../types/classes";
import Learning "../types/learning";
import Audit "../types/audit";
import Map "mo:core/Map";
import Iter "mo:core/Iter";

// Row projections for OQL entities whose stored shape is not a flat
// all-primitive record (nested media, collections, or variant fields).
// Each function returns a flat record of primitives so the entity can be
// declared with `OQL.Entity.manual` over the collection's entries.
module {
  public type LessonRow = {
    id : Common.LessonId;
    classId : Common.ClassId;
    titleEn : Text;
    titleMl : Text;
    bodyEn : Text;
    bodyMl : Text;
    order : Nat;
    hasPoster : Bool;
    fileCount : Nat;
    hasVideo : Bool;
  };

  public type ClassAccessRow = {
    studentId : Common.StudentId;
    classId : Common.ClassId;
    grantedAt : Common.Timestamp;
  };

  public type CompletionRow = {
    studentId : Common.StudentId;
    classId : Common.ClassId;
    completedAt : Common.Timestamp;
  };

  public type CountdownRow = {
    studentId : Common.StudentId;
    classId : Common.ClassId;
    startedAt : Common.Timestamp;
    endsAt : Common.Timestamp;
    overridden : Bool;
  };

  public type ManualLockRow = {
    studentId : Common.StudentId;
    classId : Common.ClassId;
  };

  public type AuditRow = {
    id : Common.AuditId;
    action : Text;
    actorPrincipal : Principal;
    detail : Text;
    at : Common.Timestamp;
  };

  public func lessonRow(l : Classes.Lesson) : LessonRow = {
    id = l.id;
    classId = l.classId;
    titleEn = l.titleEn;
    titleMl = l.titleMl;
    bodyEn = l.bodyEn;
    bodyMl = l.bodyMl;
    order = l.order;
    hasPoster = l.poster != null;
    fileCount = l.files.size();
    hasVideo = l.video != null;
  };

  public func classAccessRow(a : Learning.ClassAccess) : ClassAccessRow = {
    studentId = a.studentId;
    classId = a.classId;
    grantedAt = a.grantedAt;
  };

  public func completionRow(c : Learning.Completion) : CompletionRow = {
    studentId = c.studentId;
    classId = c.classId;
    completedAt = c.completedAt;
  };

  public func countdownRow(c : Learning.Countdown) : CountdownRow = {
    studentId = c.studentId;
    classId = c.classId;
    startedAt = c.startedAt;
    endsAt = c.endsAt;
    overridden = c.overridden;
  };

  public func manualLockRow(studentId : Common.StudentId, classId : Common.ClassId) : ManualLockRow = {
    studentId;
    classId;
  };

  public func auditRow(e : Audit.AuditEntry) : AuditRow = {
    id = e.id;
    action = auditActionText(e.action);
    actorPrincipal = e.actorPrincipal;
    detail = e.detail;
    at = e.at;
  };

  public func auditActionText(a : Common.AuditAction) : Text = switch a {
    case (#signIn) "signIn";
    case (#signOut) "signOut";
    case (#failedKey) "failedKey";
    case (#classCreated) "classCreated";
    case (#classUpdated) "classUpdated";
    case (#classDeleted) "classDeleted";
    case (#classPublished) "classPublished";
    case (#classLocked) "classLocked";
    case (#classUnlocked) "classUnlocked";
    case (#lessonChanged) "lessonChanged";
    case (#mediaChanged) "mediaChanged";
    case (#studentChanged) "studentChanged";
    case (#accessGranted) "accessGranted";
    case (#accessRevoked) "accessRevoked";
    case (#countdownOverridden) "countdownOverridden";
    case (#countdownReset) "countdownReset";
    case (#watermarkToggled) "watermarkToggled";
  };

  // Flatten a `Map<StudentId, [T]>` into one row per element, carrying the
  // owning student id. Used so each grant/completion/countdown/lock is its
  // own queryable row rather than one row per student.
  public func flattenClassAccess(
    source : Map.Map<Common.StudentId, [Common.ClassId]>
  ) : Iter.Iter<ClassAccessRow> {
    source.entries().flatMap(
      func((studentId, classIds)) = classIds.values().map(
        func(classId) = { studentId; classId; grantedAt = 0 }
      )
    );
  };

  public func flattenCompletions(
    source : Map.Map<Common.StudentId, [Learning.Completion]>
  ) : Iter.Iter<CompletionRow> {
    source.entries().flatMap(
      func((studentId, items)) = items.values().map(func(c) = completionRow({ c with studentId }))
    );
  };

  public func flattenCountdowns(
    source : Map.Map<Common.StudentId, [Learning.Countdown]>
  ) : Iter.Iter<CountdownRow> {
    source.entries().flatMap(
      func((studentId, items)) = items.values().map(func(c) = countdownRow({ c with studentId }))
    );
  };

  public func flattenManualLocks(
    source : Map.Map<Common.StudentId, [Common.ClassId]>
  ) : Iter.Iter<ManualLockRow> {
    source.entries().flatMap(
      func((studentId, ids)) = ids.values().map(func(classId) = manualLockRow(studentId, classId))
    );
  };

  public func lessonRows(
    source : Map.Map<Common.LessonId, Classes.Lesson>
  ) : Iter.Iter<LessonRow> {
    source.values().map(lessonRow);
  };
};
