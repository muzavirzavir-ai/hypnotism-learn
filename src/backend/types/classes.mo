import Common "common";

module {
  public type ClassId = Common.ClassId;
  public type LessonId = Common.LessonId;
  public type MediaId = Common.MediaId;
  public type MediaRef = Common.MediaRef;

  public type Class = {
    id : ClassId;
    titleEn : Text;
    titleMl : Text;
    descriptionEn : Text;
    descriptionMl : Text;
    order : Nat;
    published : Bool;
    locked : Bool;
    createdAt : Common.Timestamp;
    updatedAt : Common.Timestamp;
  };

  public type Lesson = {
    id : LessonId;
    classId : ClassId;
    titleEn : Text;
    titleMl : Text;
    bodyEn : Text;
    bodyMl : Text;
    order : Nat;
    poster : ?MediaRef;
    files : [MediaRef];
    video : ?MediaRef;
  };

  public type ClassInput = {
    titleEn : Text;
    titleMl : Text;
    descriptionEn : Text;
    descriptionMl : Text;
    published : Bool;
  };

  public type LessonInput = {
    classId : ClassId;
    titleEn : Text;
    titleMl : Text;
    bodyEn : Text;
    bodyMl : Text;
  };
};
