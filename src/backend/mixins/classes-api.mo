import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Types "../types/classes";
import Common "../types/common";
import ClassesLib "../lib/classes";

mixin (
  accessControlState : AccessControl.AccessControlState,
  classes : Map.Map<Common.ClassId, Types.Class>,
  lessons : Map.Map<Common.LessonId, Types.Lesson>,
  state : ClassesLib.State,
  sessions : Map.Map<Common.SessionToken, Common.Session>,
  classAccess : Map.Map<Common.StudentId, [Common.ClassId]>,
) {
  func requireClassesAdmin(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
  };

  public query func listClasses() : async [Types.Class] {
    ClassesLib.listClasses(classes);
  };

  public query func getClass(id : Types.ClassId) : async ?Types.Class {
    ClassesLib.getClass(classes, id);
  };

  public shared ({ caller }) func createClass(input : Types.ClassInput) : async Types.Class {
    requireClassesAdmin(caller);
    ClassesLib.createClass(classes, state, input);
  };

  public shared ({ caller }) func updateClass(id : Types.ClassId, input : Types.ClassInput) : async ?Types.Class {
    requireClassesAdmin(caller);
    ClassesLib.updateClass(classes, id, input);
  };

  public shared ({ caller }) func deleteClass(id : Types.ClassId) : async Bool {
    requireClassesAdmin(caller);
    ClassesLib.deleteClass(classes, lessons, id);
  };

  public shared ({ caller }) func setClassPublished(id : Types.ClassId, published : Bool) : async ?Types.Class {
    requireClassesAdmin(caller);
    ClassesLib.setPublished(classes, id, published);
  };

  public shared ({ caller }) func setClassLocked(id : Types.ClassId, locked : Bool) : async ?Types.Class {
    requireClassesAdmin(caller);
    ClassesLib.setLocked(classes, id, locked);
  };

  public shared ({ caller }) func reorderClasses(orderedIds : [Types.ClassId]) : async () {
    requireClassesAdmin(caller);
    ClassesLib.reorderClasses(classes, orderedIds);
  };

  public query func listLessons(classId : Types.ClassId) : async [Types.Lesson] {
    ClassesLib.listLessons(lessons, classId);
  };

  public shared ({ caller }) func createLesson(input : Types.LessonInput) : async Types.Lesson {
    requireClassesAdmin(caller);
    ClassesLib.createLesson(lessons, state, input);
  };

  public shared ({ caller }) func updateLesson(id : Types.LessonId, input : Types.LessonInput) : async ?Types.Lesson {
    requireClassesAdmin(caller);
    ClassesLib.updateLesson(lessons, id, input);
  };

  public shared ({ caller }) func deleteLesson(id : Types.LessonId) : async Bool {
    requireClassesAdmin(caller);
    ClassesLib.deleteLesson(lessons, id);
  };

  public shared ({ caller }) func attachLessonMedia(
    lessonId : Types.LessonId,
    kind : { #poster; #file; #video },
    name : Text,
    mimeType : Text,
    blob : Blob,
  ) : async ?Types.Lesson {
    requireClassesAdmin(caller);
    ClassesLib.attachMedia(lessons, state, lessonId, kind, name, mimeType, blob);
  };

  public shared ({ caller }) func removeLessonMedia(lessonId : Types.LessonId, mediaId : Types.MediaId) : async ?Types.Lesson {
    requireClassesAdmin(caller);
    ClassesLib.removeMedia(lessons, lessonId, mediaId);
  };

  // --- Authorized media delivery ---
  // Media blobs are never exposed through an unauthenticated endpoint. The
  // caller must be an admin, or a student holding a valid session token who has
  // been granted access to the class that owns the lesson. Any other caller
  // receives null, so no public media URL or permanent link is ever produced.
  public query ({ caller }) func getAuthorizedLessonMedia(
    token : Common.SessionToken,
    studentId : Common.StudentId,
    lessonId : Types.LessonId,
  ) : async ?Types.Lesson {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return lessons.get(lessonId);
    };
    switch (sessions.get(token)) {
      case (null) { null };
      case (?session) {
        if (session.role != #student) { return null };
        switch (lessons.get(lessonId)) {
          case (null) { null };
          case (?lesson) {
            let granted = classAccess.get(studentId) ?? [];
            if (granted.contains(lesson.classId)) { ?lesson } else { null };
          };
        };
      };
    };
  };
};
