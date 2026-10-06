import Map "mo:core/Map";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import OQL "mo:caffeineai-oql";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import BoolValue "mo:caffeineai-oql/BoolValue";
import IntValue "mo:caffeineai-oql/IntValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";

import Common "types/common";
import AccessTypes "types/access";
import ClassTypes "types/classes";
import StudentTypes "types/students";
import LearningTypes "types/learning";
import AuditTypes "types/audit";

import AccessApi "mixins/access-api";
import ClassesApi "mixins/classes-api";
import StudentsApi "mixins/students-api";
import LearningApi "mixins/learning-api";
import AuditApi "mixins/audit-api";
import ApiDocMixin "mixins/api-doc";

import AccessLib "lib/access";
import AuditLib "lib/audit";
import OqlRows "lib/oql-rows";

actor {
  // --- Authorization (platform component) ---
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);

  // --- Private object storage (platform component) ---
  include MixinObjectStorage();

  // --- Access keys & sessions ---
  let adminKey : Text;
  let studentKey : Text;
  let sessions : Map.Map<Common.SessionToken, Common.Session>;
  let failedAttempts : Map.Map<Principal, { var count : Nat; var lastAttemptAt : Common.Timestamp }>;

  // --- Classes & lessons ---
  let classes : Map.Map<Common.ClassId, ClassTypes.Class>;
  let lessons : Map.Map<Common.LessonId, ClassTypes.Lesson>;
  let state : { var nextClassId : Nat; var nextLessonId : Nat; var nextMediaId : Nat };

  // --- Students & access ---
  let students : Map.Map<Common.StudentId, StudentTypes.Student>;
  let studentState : { var nextStudentId : Nat };
  let classAccess : Map.Map<Common.StudentId, [Common.ClassId]>;
  let completions : Map.Map<Common.StudentId, [LearningTypes.Completion]>;
  let countdowns : Map.Map<Common.StudentId, [LearningTypes.Countdown]>;
  let manualLocks : Map.Map<Common.StudentId, [Common.ClassId]>;
  // Binds a signed-in student's principal to their own student record, so
  // student-facing endpoints can enforce ownership without trusting a
  // client-supplied studentId.
  let studentPrincipals : Map.Map<Principal, Common.StudentId>;

  // --- Audit log ---
  let auditLog : Map.Map<Common.AuditId, AuditTypes.AuditEntry>;
  let auditState : { var nextAuditId : Nat };

  // Shared access state: the same record binding is passed to the access mixin
  // so key verification, sessions, rate limiting, and audit writes all operate
  // on the actor's stable state.
  transient let accessState : AccessLib.State = {
    adminKey;
    studentKey;
    sessions;
    failedAttempts;
    auditLog;
    auditState;
  };

  include AccessApi(accessState, accessControlState);
  include ClassesApi(accessControlState, classes, lessons, state, sessions, classAccess);
  include StudentsApi(accessControlState, students, studentState, classAccess, completions, countdowns, manualLocks, studentPrincipals);
  include LearningApi(accessControlState, classes, classAccess, completions, countdowns, manualLocks, studentPrincipals);
  include AuditApi(accessControlState, auditLog);
  include ApiDocMixin();

  include Expose({
    entities = [
      // Classes: public catalogue metadata (no media, no secrets).
      classes.toEntity("class", "Class", "id")
        .sample({
          id = 0;
          titleEn = "";
          titleMl = "";
          descriptionEn = "";
          descriptionMl = "";
          order = 0;
          published = false;
          locked = false;
          createdAt = 0;
          updatedAt = 0;
        })
        .public_()
        .build(),

      // Lessons: text content plus media presence flags. Media blobs are not
      // exposed; only whether a poster/video exists and how many files.
      OQL.Entity.manual<OqlRows.LessonRow>(
        "lesson",
        func() = OqlRows.lessonRows(lessons),
        "Lesson",
        "id",
      )
        .sample({
          id = 0;
          classId = 0;
          titleEn = "";
          titleMl = "";
          bodyEn = "";
          bodyMl = "";
          order = 0;
          hasPoster = false;
          fileCount = 0;
          hasVideo = false;
        })
        .payload("id", func(r) = r.id)
        .payload("classId", func(r) = r.classId)
        .payload("titleEn", func(r) = r.titleEn)
        .payload("titleMl", func(r) = r.titleMl)
        .payload("bodyEn", func(r) = r.bodyEn)
        .payload("bodyMl", func(r) = r.bodyMl)
        .payload("order", func(r) = r.order)
        .payload("hasPoster", func(r) = r.hasPoster)
        .payload("fileCount", func(r) = r.fileCount)
        .payload("hasVideo", func(r) = r.hasVideo)
        .edge("classId", "class")
        .public_()
        .build(),

      // Students: admin-managed roster. Private to the platform agent.
      students.toEntity("student", "Student", "id")
        .sample({
          id = 0;
          name = "";
          identifier = "";
          watermarkEnabled = false;
          createdAt = 0;
        })
        .controllerOnly()
        .build(),

      // Class access grants: one row per (student, class) grant.
      OQL.Entity.manual<OqlRows.ClassAccessRow>(
        "classAccess",
        func() = OqlRows.flattenClassAccess(classAccess),
        "ClassAccess",
        "id",
      )
        .sample({ studentId = 0; classId = 0; grantedAt = 0 })
        .payload("id", func(r) = r.studentId.toText() # ":" # r.classId.toText())
        .payload("studentId", func(r) = r.studentId)
        .payload("classId", func(r) = r.classId)
        .payload("grantedAt", func(r) = r.grantedAt)
        .edge("studentId", "student")
        .edge("classId", "class")
        .controllerOnly()
        .build(),

      // Completions: one row per (student, class) completion.
      OQL.Entity.manual<OqlRows.CompletionRow>(
        "completion",
        func() = OqlRows.flattenCompletions(completions),
        "Completion",
        "id",
      )
        .sample({ studentId = 0; classId = 0; completedAt = 0 })
        .payload("id", func(r) = r.studentId.toText() # ":" # r.classId.toText())
        .payload("studentId", func(r) = r.studentId)
        .payload("classId", func(r) = r.classId)
        .payload("completedAt", func(r) = r.completedAt)
        .edge("studentId", "student")
        .edge("classId", "class")
        .controllerOnly()
        .build(),

      // Countdowns: one row per (student, class) 24-hour unlock timer.
      OQL.Entity.manual<OqlRows.CountdownRow>(
        "countdown",
        func() = OqlRows.flattenCountdowns(countdowns),
        "Countdown",
        "id",
      )
        .sample({ studentId = 0; classId = 0; startedAt = 0; endsAt = 0; overridden = false })
        .payload("id", func(r) = r.studentId.toText() # ":" # r.classId.toText())
        .payload("studentId", func(r) = r.studentId)
        .payload("classId", func(r) = r.classId)
        .payload("startedAt", func(r) = r.startedAt)
        .payload("endsAt", func(r) = r.endsAt)
        .payload("overridden", func(r) = r.overridden)
        .edge("studentId", "student")
        .edge("classId", "class")
        .controllerOnly()
        .build(),

      // Manual locks: one row per (student, class) admin lock.
      OQL.Entity.manual<OqlRows.ManualLockRow>(
        "manualLock",
        func() = OqlRows.flattenManualLocks(manualLocks),
        "ManualLock",
        "id",
      )
        .sample({ studentId = 0; classId = 0 })
        .payload("id", func(r) = r.studentId.toText() # ":" # r.classId.toText())
        .payload("studentId", func(r) = r.studentId)
        .payload("classId", func(r) = r.classId)
        .edge("studentId", "student")
        .edge("classId", "class")
        .controllerOnly()
        .build(),

      // Audit log: security activity. Private to the platform agent.
      OQL.Entity.manual<OqlRows.AuditRow>(
        "auditEntry",
        func() = auditLog.values().map(OqlRows.auditRow),
        "AuditEntry",
        "id",
      )
        .sample({
          id = 0;
          action = "signIn";
          actorPrincipal = Principal.fromText("aaaaa-aa");
          detail = "";
          at = 0;
        })
        .payload("id", func(r) = r.id)
        .payload("action", func(r) = r.action)
        .payload("actorPrincipal", func(r) = r.actorPrincipal)
        .payload("detail", func(r) = r.detail)
        .payload("at", func(r) = r.at)
        .controllerOnly()
        .build(),
    ];
  });
};
