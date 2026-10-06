import { createActor } from "@/backend";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MediaViewer } from "@/components/MediaViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import type {
  Class,
  Lesson,
  StudentClassView,
  StudentDashboard,
  StudentSelfView,
} from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useRouterState } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

/** Read the optional `studentId` search param without a route schema. */
function useStudentIdParam(): bigint | null {
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const raw = search.studentId;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return BigInt(Math.trunc(raw));
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return BigInt(raw);
  }
  return null;
}

/** Read the optional `identifier` search param without a route schema. */
function useIdentifierParam(): string | null {
  const search = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const raw = search.identifier;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function parseClassId(raw: string | undefined): bigint | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  return BigInt(raw);
}

function LessonBlock({
  lesson,
  index,
  studentId,
  watermarkEnabled,
  identifier,
}: {
  lesson: Lesson;
  index: number;
  studentId: bigint;
  watermarkEnabled: boolean;
  identifier: string;
}) {
  const { language } = useLanguage();
  const title = language === "ml" ? lesson.titleMl : lesson.titleEn;
  const body = language === "ml" ? lesson.bodyMl : lesson.bodyEn;

  return (
    <article
      className="space-y-4 border-t border-border pt-8 first:border-t-0 first:pt-0"
      data-ocid={`class.lesson.${index}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
          {index}
        </span>
        <h3 className="font-display text-xl font-semibold leading-snug tracking-tight">
          {title}
        </h3>
      </div>
      {body ? (
        <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {body}
        </p>
      ) : null}
      <MediaViewer
        lessonId={lesson.id}
        studentId={studentId}
        watermarkEnabled={watermarkEnabled}
        identifier={identifier}
      />
    </article>
  );
}

/**
 * Class viewer: shows an unlocked class's lessons (bilingual text, poster,
 * files, and video) and a Complete Class action that starts the server-side
 * 24-hour countdown for the next class.
 */
export function ClassViewerPage() {
  const { t, language } = useLanguage();
  const { session, isRestoring } = useSession();
  const params = useParams({ strict: false }) as { id?: string };
  const classId = parseClassId(params.id);
  const studentIdParam = useStudentIdParam();
  const identifierParam = useIdentifierParam();
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const [completeError, setCompleteError] = useState(false);

  // Fall back to the session identifier (or an `identifier` search param) so a
  // direct link to the class viewer still resolves the signed-in student.
  const identifier = identifierParam ?? session?.identifier ?? null;

  const resolvedQuery = useQuery({
    queryKey: ["studentSelf", identifier ?? "none"],
    queryFn: async (): Promise<bigint | null> => {
      if (!actor || !identifier) return null;
      const self = await actor.resolveStudent(identifier);
      return self ? self.id : null;
    },
    enabled: !!actor && !isFetching && !!identifier && studentIdParam === null,
    retry: false,
  });

  const studentId = studentIdParam ?? resolvedQuery.data ?? null;

  const dashboardQuery = useQuery({
    queryKey: ["studentDashboard", studentId?.toString() ?? "none"],
    queryFn: async (): Promise<StudentDashboard | null> => {
      if (!actor || studentId === null) return null;
      return actor.getStudentDashboard(studentId);
    },
    enabled: !!actor && !isFetching && studentId !== null,
  });

  const lessonsQuery = useQuery({
    queryKey: ["lessons", classId?.toString() ?? "none"],
    queryFn: async (): Promise<Lesson[]> => {
      if (!actor || classId === null) return [];
      return actor.listLessons(classId);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });

  const classQuery = useQuery({
    queryKey: ["class", classId?.toString() ?? "none"],
    queryFn: async (): Promise<Class | null> => {
      if (!actor || classId === null) return null;
      return actor.getClass(classId);
    },
    enabled: !!actor && !isFetching && classId !== null,
  });

  // Per-student watermark setting. `resolveStudent` is the student-facing
  // binding: it resolves the caller's own record from the identifier entered at
  // sign-in and returns the admin's watermark toggle. The query fails soft and
  // the secure default (watermark on) is used until the setting is known.
  const studentQuery = useQuery({
    queryKey: ["studentSelf", session?.identifier ?? "none"],
    queryFn: async (): Promise<StudentSelfView | null> => {
      if (!actor || !session?.identifier) return null;
      return actor.resolveStudent(session.identifier);
    },
    enabled: !!actor && !isFetching && !!session?.identifier,
    retry: false,
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!actor || studentId === null || classId === null) {
        throw new Error("Backend is not ready");
      }
      return actor.completeClass(studentId, classId);
    },
    onSuccess: () => {
      setCompleteError(false);
      void queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
    onError: () => {
      setCompleteError(true);
    },
  });

  const refetchDashboard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
  }, [queryClient]);

  const view: StudentClassView | null = useMemo(() => {
    if (!dashboardQuery.data || classId === null) return null;
    return (
      dashboardQuery.data.classes.find(
        (entry) => entry.classInfo.id === classId,
      ) ?? null
    );
  }, [dashboardQuery.data, classId]);

  const classInfo = view?.classInfo ?? classQuery.data ?? null;
  const title = classInfo
    ? language === "ml"
      ? classInfo.titleMl
      : classInfo.titleEn
    : "";
  const description = classInfo
    ? language === "ml"
      ? classInfo.descriptionMl
      : classInfo.descriptionEn
    : "";

  const isLoading =
    isRestoring ||
    resolvedQuery.isLoading ||
    dashboardQuery.isLoading ||
    lessonsQuery.isLoading ||
    classQuery.isLoading;

  if (isLoading) {
    return (
      <section
        className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14"
        data-ocid="class_viewer.loading_state"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-12 w-3/4" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-8 aspect-video w-full rounded-xl" />
      </section>
    );
  }

  if (!session) {
    return (
      <section
        className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="class_viewer.signin_required_state"
      >
        <ShieldAlert className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {t("student.signInRequired")}
        </h1>
        <Button asChild className="mt-6 rounded-xl">
          <Link to="/">{t("student.signInAction")}</Link>
        </Button>
      </section>
    );
  }

  if (classId === null || studentId === null || !classInfo) {
    return (
      <section
        className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="class_viewer.not_found_state"
      >
        <ShieldAlert
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {t("class.notFound")}
        </h1>
        <Button asChild variant="outline" className="mt-6 rounded-xl">
          <Link to="/student" search={{ studentId: studentId?.toString() }}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("class.backToDashboard")}
          </Link>
        </Button>
      </section>
    );
  }

  const isLocked = view?.locked ?? false;
  const isCompleted = view?.completed ?? false;
  const countdownEndsAt = view?.countdownEndsAt;
  const lessons = lessonsQuery.data ?? [];
  // Honor the admin's per-student watermark setting; keep the secure default
  // (on) while the setting is loading or unavailable to this session.
  const watermarkEnabled = studentQuery.data?.watermarkEnabled ?? true;
  // Overlay the student's own identifier, falling back to the resolved record.
  const watermarkIdentifier =
    studentQuery.data?.identifier ??
    session?.identifier ??
    studentId.toString();

  if (isLocked) {
    return (
      <section
        className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14"
        data-ocid="class_viewer.locked_state"
      >
        <Button asChild variant="ghost" size="sm" className="mb-6 rounded-xl">
          <Link to="/student" search={{ studentId: studentId.toString() }}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("class.backToDashboard")}
          </Link>
        </Button>
        <Card className="flex flex-col items-center gap-4 rounded-2xl border bg-card px-6 py-16 text-center shadow-subtle">
          <Lock className="h-10 w-10 text-warning" aria-hidden="true" />
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {t("class.lockedTitle")}
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("class.lockedBody")}
          </p>
          {countdownEndsAt !== undefined ? (
            <div className="mt-2 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-warning">
                {t("class.nextUnlock")}
              </span>
              <CountdownTimer
                endsAt={countdownEndsAt}
                onElapsed={refetchDashboard}
                size="lg"
              />
            </div>
          ) : null}
        </Card>
      </section>
    );
  }

  return (
    <section
      className="mx-auto max-w-4xl px-4 py-10 md:px-6 md:py-14"
      data-ocid="class_viewer.page"
    >
      <Button asChild variant="ghost" size="sm" className="mb-6 rounded-xl">
        <Link to="/student" search={{ studentId: studentId.toString() }}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("class.backToDashboard")}
        </Link>
      </Button>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {isCompleted ? (
            <Badge className="gap-1 rounded-full border-transparent bg-success/15 text-success">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              {t("student.completed")}
            </Badge>
          ) : (
            <Badge className="gap-1 rounded-full border-transparent bg-primary/15 text-primary">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              {t("student.unlocked")}
            </Badge>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </header>

      <div className="mt-10 space-y-8">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {t("class.lessonsTitle")}
        </h2>
        {lessons.length === 0 ? (
          <p
            className="rounded-xl border border-border bg-muted/30 px-6 py-10 text-center text-sm text-muted-foreground"
            data-ocid="class.lessons_empty_state"
          >
            {t("class.noLessons")}
          </p>
        ) : (
          <div className="space-y-8" data-ocid="class.lesson_list">
            {lessons.map((lesson, index) => (
              <LessonBlock
                key={lesson.id.toString()}
                lesson={lesson}
                index={index + 1}
                studentId={studentId}
                watermarkEnabled={watermarkEnabled}
                identifier={watermarkIdentifier}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-border pt-8">
        {isCompleted ? (
          <div
            className="flex flex-col gap-3 rounded-2xl border border-success/30 bg-success/10 p-5"
            data-ocid="class.completed_state"
          >
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              <span className="font-display font-semibold">
                {t("class.completed")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("class.completedHint")}
            </p>
            {countdownEndsAt !== undefined ? (
              <CountdownTimer
                endsAt={countdownEndsAt}
                onElapsed={refetchDashboard}
                size="lg"
                className="self-start"
              />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              size="lg"
              className="w-full rounded-xl sm:w-auto"
              disabled={completeMutation.isPending}
              onClick={() => completeMutation.mutate()}
              data-ocid="class.complete_button"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {completeMutation.isPending
                ? t("class.completing")
                : t("class.completeButton")}
            </Button>
            {completeError ? (
              <p
                className="text-sm text-destructive"
                role="alert"
                data-ocid="class.complete_error"
              >
                {t("class.completeError")}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
