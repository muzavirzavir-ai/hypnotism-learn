import { createActor } from "@/backend";
import type {
  AuditEntry,
  Class,
  ClassId,
  ClassInput,
  Lesson,
  LessonId,
  LessonInput,
  MediaKind,
  MediaRef,
  Student,
  StudentId,
  StudentInput,
  StudentView,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  classes: ["classes"] as const,
  lessons: (classId: ClassId) => ["lessons", String(classId)] as const,
  students: ["students"] as const,
  audit: (limit: number) => ["audit", limit] as const,
};

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export function useClasses() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: async (): Promise<Class[]> => {
      if (!actor) return [];
      return actor.listClasses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLessons(classId: ClassId | null) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.lessons(classId ?? 0n),
    queryFn: async (): Promise<Lesson[]> => {
      if (!actor || classId === null) return [];
      return actor.listLessons(classId);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });
}

export function useStudents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: async (): Promise<StudentView[]> => {
      if (!actor) return [];
      return actor.listStudents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAuditLog(limit = 100) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: queryKeys.audit(limit),
    queryFn: async (): Promise<AuditEntry[]> => {
      if (!actor) return [];
      return actor.listAudit(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------------------------------------------ */
/* Class mutations                                                     */
/* ------------------------------------------------------------------ */

export function useCreateClass() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClassInput): Promise<Class> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createClass(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
    },
  });
}

export function useUpdateClass() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: ClassId; input: ClassInput }): Promise<Class | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateClass(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
    },
  });
}

export function useDeleteClass() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: ClassId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteClass(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useSetClassPublished() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      published,
    }: { id: ClassId; published: boolean }): Promise<Class | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setClassPublished(id, published);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
    },
  });
}

export function useSetClassLocked() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      locked,
    }: { id: ClassId; locked: boolean }): Promise<Class | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setClassLocked(id, locked);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
    },
  });
}

export function useReorderClasses() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: ClassId[]): Promise<void> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.reorderClasses(orderedIds);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Lesson mutations                                                    */
/* ------------------------------------------------------------------ */

export function useCreateLesson() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LessonInput): Promise<Lesson> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createLesson(input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lessons(variables.classId),
      });
    },
  });
}

export function useUpdateLesson() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: LessonId; input: LessonInput }): Promise<Lesson | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateLesson(id, input);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lessons(variables.input.classId),
      });
    },
  });
}

export function useDeleteLesson() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
    }: { id: LessonId; classId: ClassId }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteLesson(id);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lessons(variables.classId),
      });
    },
  });
}

export function useAttachLessonMedia() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      kind,
      name,
      mimeType,
      blob,
    }: {
      lessonId: LessonId;
      kind: MediaKind;
      name: string;
      mimeType: string;
      blob: Uint8Array;
      classId: ClassId;
    }): Promise<Lesson | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.attachLessonMedia(lessonId, kind, name, mimeType, blob);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lessons(variables.classId),
      });
    },
  });
}

export function useRemoveLessonMedia() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      lessonId,
      mediaId,
    }: {
      lessonId: LessonId;
      mediaId: bigint;
      classId: ClassId;
    }): Promise<Lesson | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.removeLessonMedia(lessonId, mediaId);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.lessons(variables.classId),
      });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Student mutations                                                   */
/* ------------------------------------------------------------------ */

export function useCreateStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentInput): Promise<Student> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createStudent(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useUpdateStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: { id: StudentId; input: StudentInput }): Promise<Student | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateStudent(id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useDeleteStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: StudentId): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteStudent(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useGrantClassAccess() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
    }: { studentId: StudentId; classId: ClassId }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.grantClassAccess(studentId, classId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useRevokeClassAccess() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
    }: { studentId: StudentId; classId: ClassId }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.revokeClassAccess(studentId, classId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useSetStudentWatermark() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      enabled,
    }: { studentId: StudentId; enabled: boolean }): Promise<Student | null> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setStudentWatermark(studentId, enabled);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Countdown / lock overrides                                          */
/* ------------------------------------------------------------------ */

export function useSetClassLockForStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
      locked,
    }: {
      studentId: StudentId;
      classId: ClassId;
      locked: boolean;
    }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.setClassLockForStudent(studentId, classId, locked);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useOverrideCountdown() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
      endsAt,
    }: {
      studentId: StudentId;
      classId: ClassId;
      endsAt: bigint;
    }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.overrideCountdown(studentId, classId, endsAt);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

export function useResetCountdown() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      classId,
    }: { studentId: StudentId; classId: ClassId }): Promise<boolean> => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.resetCountdown(studentId, classId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Read a `MediaRef`'s display name without exposing its bytes. */
export function mediaLabel(media: MediaRef): string {
  return media.name;
}
