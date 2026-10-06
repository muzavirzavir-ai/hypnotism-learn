import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Types "../types/classes";
import Common "../types/common";

module {
  public type State = {
    var nextClassId : Nat;
    var nextLessonId : Nat;
    var nextMediaId : Nat;
  };

  public func listClasses(classes : Map.Map<Common.ClassId, Types.Class>) : [Types.Class] {
    let all = classes.values().toArray();
    all.sort(func(a, b) = Nat.compare(a.order, b.order));
  };

  public func getClass(classes : Map.Map<Common.ClassId, Types.Class>, id : Types.ClassId) : ?Types.Class {
    classes.get(id);
  };

  public func createClass(
    classes : Map.Map<Common.ClassId, Types.Class>,
    state : State,
    input : Types.ClassInput,
  ) : Types.Class {
    let id = state.nextClassId;
    state.nextClassId := id + 1;
    let now = Time.now();
    let order = classes.size();
    let classInfo : Types.Class = {
      id;
      titleEn = input.titleEn;
      titleMl = input.titleMl;
      descriptionEn = input.descriptionEn;
      descriptionMl = input.descriptionMl;
      order;
      published = input.published;
      locked = false;
      createdAt = now;
      updatedAt = now;
    };
    classes.add(id, classInfo);
    classInfo;
  };

  public func updateClass(
    classes : Map.Map<Common.ClassId, Types.Class>,
    id : Types.ClassId,
    input : Types.ClassInput,
  ) : ?Types.Class {
    switch (classes.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : Types.Class = {
          id = existing.id;
          titleEn = input.titleEn;
          titleMl = input.titleMl;
          descriptionEn = input.descriptionEn;
          descriptionMl = input.descriptionMl;
          order = existing.order;
          published = input.published;
          locked = existing.locked;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        classes.add(id, updated);
        ?updated;
      };
    };
  };

  public func deleteClass(
    classes : Map.Map<Common.ClassId, Types.Class>,
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    id : Types.ClassId,
  ) : Bool {
    switch (classes.get(id)) {
      case (null) { false };
      case (?_) {
        classes.remove(id);
        let remaining = lessons.values().toArray().filter(func(lesson) = lesson.classId != id);
        lessons.clear();
        for (lesson in remaining.values()) {
          lessons.add(lesson.id, lesson);
        };
        true;
      };
    };
  };

  public func setPublished(
    classes : Map.Map<Common.ClassId, Types.Class>,
    id : Types.ClassId,
    published : Bool,
  ) : ?Types.Class {
    switch (classes.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : Types.Class = {
          id = existing.id;
          titleEn = existing.titleEn;
          titleMl = existing.titleMl;
          descriptionEn = existing.descriptionEn;
          descriptionMl = existing.descriptionMl;
          order = existing.order;
          published;
          locked = existing.locked;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        classes.add(id, updated);
        ?updated;
      };
    };
  };

  public func setLocked(
    classes : Map.Map<Common.ClassId, Types.Class>,
    id : Types.ClassId,
    locked : Bool,
  ) : ?Types.Class {
    switch (classes.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : Types.Class = {
          id = existing.id;
          titleEn = existing.titleEn;
          titleMl = existing.titleMl;
          descriptionEn = existing.descriptionEn;
          descriptionMl = existing.descriptionMl;
          order = existing.order;
          published = existing.published;
          locked;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
        };
        classes.add(id, updated);
        ?updated;
      };
    };
  };

  public func reorderClasses(
    classes : Map.Map<Common.ClassId, Types.Class>,
    orderedIds : [Types.ClassId],
  ) : () {
    var order = 0;
    for (id in orderedIds.values()) {
      switch (classes.get(id)) {
        case (null) {};
        case (?existing) {
          let updated : Types.Class = {
            id = existing.id;
            titleEn = existing.titleEn;
            titleMl = existing.titleMl;
            descriptionEn = existing.descriptionEn;
            descriptionMl = existing.descriptionMl;
            order;
            published = existing.published;
            locked = existing.locked;
            createdAt = existing.createdAt;
            updatedAt = Time.now();
          };
          classes.add(id, updated);
          order += 1;
        };
      };
    };
  };

  public func listLessons(
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    classId : Types.ClassId,
  ) : [Types.Lesson] {
    let all = lessons.values().toArray();
    let filtered = all.filter(func(lesson) = lesson.classId == classId);
    filtered.sort(func(a, b) = Nat.compare(a.order, b.order));
  };

  public func createLesson(
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    state : State,
    input : Types.LessonInput,
  ) : Types.Lesson {
    let id = state.nextLessonId;
    state.nextLessonId := id + 1;
    let order = lessons.values().toArray().filter(func(lesson) = lesson.classId == input.classId).size();
    let lesson : Types.Lesson = {
      id;
      classId = input.classId;
      titleEn = input.titleEn;
      titleMl = input.titleMl;
      bodyEn = input.bodyEn;
      bodyMl = input.bodyMl;
      order;
      poster = null;
      files = [];
      video = null;
    };
    lessons.add(id, lesson);
    lesson;
  };

  public func updateLesson(
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    id : Types.LessonId,
    input : Types.LessonInput,
  ) : ?Types.Lesson {
    switch (lessons.get(id)) {
      case (null) { null };
      case (?existing) {
        let updated : Types.Lesson = {
          id = existing.id;
          classId = existing.classId;
          titleEn = input.titleEn;
          titleMl = input.titleMl;
          bodyEn = input.bodyEn;
          bodyMl = input.bodyMl;
          order = existing.order;
          poster = existing.poster;
          files = existing.files;
          video = existing.video;
        };
        lessons.add(id, updated);
        ?updated;
      };
    };
  };

  public func deleteLesson(lessons : Map.Map<Common.LessonId, Types.Lesson>, id : Types.LessonId) : Bool {
    switch (lessons.get(id)) {
      case (null) { false };
      case (?_) {
        lessons.remove(id);
        true;
      };
    };
  };

  public func attachMedia(
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    state : State,
    lessonId : Types.LessonId,
    kind : Common.MediaKind,
    name : Text,
    mimeType : Text,
    blob : Blob,
  ) : ?Types.Lesson {
    switch (lessons.get(lessonId)) {
      case (null) { null };
      case (?existing) {
        let mediaId = state.nextMediaId;
        state.nextMediaId := mediaId + 1;
        let media : Common.MediaRef = {
          id = mediaId;
          kind;
          name;
          mimeType;
          blob;
          uploadedAt = Time.now();
        };
        let updated : Types.Lesson = switch (kind) {
          case (#poster) {
            {
              id = existing.id;
              classId = existing.classId;
              titleEn = existing.titleEn;
              titleMl = existing.titleMl;
              bodyEn = existing.bodyEn;
              bodyMl = existing.bodyMl;
              order = existing.order;
              poster = ?media;
              files = existing.files;
              video = existing.video;
            };
          };
          case (#video) {
            {
              id = existing.id;
              classId = existing.classId;
              titleEn = existing.titleEn;
              titleMl = existing.titleMl;
              bodyEn = existing.bodyEn;
              bodyMl = existing.bodyMl;
              order = existing.order;
              poster = existing.poster;
              files = existing.files;
              video = ?media;
            };
          };
          case (#file) {
            {
              id = existing.id;
              classId = existing.classId;
              titleEn = existing.titleEn;
              titleMl = existing.titleMl;
              bodyEn = existing.bodyEn;
              bodyMl = existing.bodyMl;
              order = existing.order;
              poster = existing.poster;
              files = existing.files.concat([media]);
              video = existing.video;
            };
          };
        };
        lessons.add(lessonId, updated);
        ?updated;
      };
    };
  };

  public func removeMedia(
    lessons : Map.Map<Common.LessonId, Types.Lesson>,
    lessonId : Types.LessonId,
    mediaId : Types.MediaId,
  ) : ?Types.Lesson {
    switch (lessons.get(lessonId)) {
      case (null) { null };
      case (?existing) {
        let poster = switch (existing.poster) {
          case (?p) { if (p.id == mediaId) { null } else { ?p } };
          case (null) { null };
        };
        let video = switch (existing.video) {
          case (?v) { if (v.id == mediaId) { null } else { ?v } };
          case (null) { null };
        };
        let files = existing.files.filter(func(f) = f.id != mediaId);
        let updated : Types.Lesson = {
          id = existing.id;
          classId = existing.classId;
          titleEn = existing.titleEn;
          titleMl = existing.titleMl;
          bodyEn = existing.bodyEn;
          bodyMl = existing.bodyMl;
          order = existing.order;
          poster;
          files;
          video;
        };
        lessons.add(lessonId, updated);
        ?updated;
      };
    };
  };
};
