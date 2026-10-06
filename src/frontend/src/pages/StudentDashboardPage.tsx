import { createActor } from "@/backend";
import { ClassCard } from "@/components/ClassCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import type { StudentDashboard } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, KeyRound, Sparkles } from "lucide-react";
import { useCallback } from "react";

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

function DashboardSkeleton() {
  const ids = Array.from({ length: 3 }, (_, i) => `dash-skeleton-${i}`);
  return (
    <div className="space-y-6" data-ocid="student.loading_state">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <Skeleton key={id} className="h-52 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Student dashboard: the signed-in student's assigned classes in sequence,
 * overall progress, and the current countdown at a glance.
 */
export function StudentDashboardPage() {
  const { t } = useLanguage();
  const { session, isRestoring } = useSession();
  const studentIdParam = useStudentIdParam();
  const identifierParam = useIdentifierParam();
  const { actor, isFetching } = useActor(createActor);

  // Fall back to the session identifier (or an `identifier` search param) so a
  // direct link to /student still resolves the signed-in student's record.
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

  const query = useQuery({
    queryKey: ["studentDashboard", studentId?.toString() ?? "none"],
    queryFn: async (): Promise<StudentDashboard | null> => {
      if (!actor || studentId === null) return null;
      return actor.getStudentDashboard(studentId);
    },
    enabled: !!actor && !isFetching && studentId !== null,
  });

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  const dashboard = query.data ?? null;

  if (isRestoring) {
    return (
      <section
        className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
        data-ocid="student.page"
      >
        <DashboardSkeleton />
      </section>
    );
  }

  if (!session) {
    return (
      <section
        className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="student.signin_required_state"
      >
        <KeyRound className="h-10 w-10 text-primary" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {t("student.title")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("student.signInRequired")}
        </p>
        <Button
          asChild
          className="mt-6 rounded-xl"
          data-ocid="student.signin_button"
        >
          <Link to="/">{t("student.signInAction")}</Link>
        </Button>
      </section>
    );
  }

  if (studentId === null) {
    if (resolvedQuery.isLoading) {
      return (
        <section
          className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
          data-ocid="student.page"
        >
          <DashboardSkeleton />
        </section>
      );
    }
    return (
      <section
        className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="student.no_student_state"
      >
        <GraduationCap
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {t("student.title")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("student.noStudent")}
        </p>
      </section>
    );
  }

  if (query.isLoading) {
    return (
      <section
        className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
        data-ocid="student.page"
      >
        <DashboardSkeleton />
      </section>
    );
  }

  if (query.isError) {
    return (
      <section
        className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="student.error_state"
      >
        <p className="text-sm text-muted-foreground">{t("error.generic")}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 rounded-xl"
          onClick={refetch}
          data-ocid="student.retry_button"
        >
          {t("common.retry")}
        </Button>
      </section>
    );
  }

  const classes = dashboard?.classes ?? [];
  const total = Number(dashboard?.totalCount ?? 0);
  const completed = Number(dashboard?.completedCount ?? 0);
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const countdownEndsAt = dashboard?.currentCountdownEndsAt;

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
      data-ocid="student.page"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {t("nav.dashboard")}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {t("student.title")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("student.subtitle")}
        </p>
      </header>

      <Card
        className="mt-8 gap-0 rounded-2xl border bg-card p-5 shadow-subtle md:p-6"
        data-ocid="student.progress_panel"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("student.progressLabel")}
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {progressPct}%
              </span>
            </div>
            <Progress
              value={progressPct}
              className="h-2.5"
              data-ocid="student.progress_bar"
            />
            <p className="text-sm text-muted-foreground">
              {t("student.progressValue", { completed, total })}
            </p>
          </div>

          {countdownEndsAt !== undefined ? (
            <div className="flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/10 p-4 md:min-w-56">
              <span className="text-xs font-semibold uppercase tracking-widest text-warning">
                {t("student.currentCountdown")}
              </span>
              <CountdownTimer
                endsAt={countdownEndsAt}
                onElapsed={refetch}
                size="lg"
              />
            </div>
          ) : completed > 0 && completed === total && total > 0 ? (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("student.allComplete")}
            </div>
          ) : null}
        </div>
      </Card>

      {classes.length === 0 ? (
        <div
          className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-border bg-muted/30 px-6 py-16 text-center"
          data-ocid="student.empty_state"
        >
          <GraduationCap
            className="h-10 w-10 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="font-display text-lg font-semibold">
            {t("student.empty")}
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            {t("student.emptyHint")}
          </p>
        </div>
      ) : (
        <div
          className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          data-ocid="student.class_list"
        >
          {classes.map((view, index) => (
            <ClassCard
              key={view.classInfo.id.toString()}
              view={view}
              index={index + 1}
              studentId={studentId}
              onCountdownElapsed={refetch}
            />
          ))}
        </div>
      )}
    </section>
  );
}
