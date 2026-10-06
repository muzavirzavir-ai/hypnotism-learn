import { CountdownTimer } from "@/components/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import type { StudentClassView } from "@/types";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, PlayCircle } from "lucide-react";

interface ClassCardProps {
  view: StudentClassView;
  /** 1-based position in the student's assigned sequence. */
  index: number;
  /** The signed-in student's id, forwarded to the class viewer route. */
  studentId: bigint;
  /** Called when a countdown on this card reaches zero. */
  onCountdownElapsed?: () => void;
}

/**
 * A single class in the student's sequence. Locked classes are clearly
 * marked and non-navigable; unlocked classes link to the class viewer.
 */
export function ClassCard({
  view,
  index,
  studentId,
  onCountdownElapsed,
}: ClassCardProps) {
  const { t, language } = useLanguage();
  const { classInfo, locked, completed, countdownEndsAt } = view;

  const title = language === "ml" ? classInfo.titleMl : classInfo.titleEn;
  const description =
    language === "ml" ? classInfo.descriptionMl : classInfo.descriptionEn;

  const status = completed ? "completed" : locked ? "locked" : "unlocked";

  const statusBadge = {
    completed: (
      <Badge className="gap-1 rounded-full border-transparent bg-success/15 text-success">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {t("student.completed")}
      </Badge>
    ),
    locked: (
      <Badge className="gap-1 rounded-full border-transparent bg-warning/15 text-warning">
        <Lock className="h-3 w-3" aria-hidden="true" />
        {t("student.locked")}
      </Badge>
    ),
    unlocked: (
      <Badge className="gap-1 rounded-full border-transparent bg-primary/15 text-primary">
        <PlayCircle className="h-3 w-3" aria-hidden="true" />
        {t("student.unlocked")}
      </Badge>
    ),
  }[status];

  return (
    <Card
      className={cn(
        "group relative gap-0 overflow-hidden rounded-2xl border bg-card p-0 shadow-subtle transition-smooth",
        locked
          ? "opacity-80"
          : "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
      )}
      data-ocid={`student.class_card.${index}`}
    >
      <div
        className={cn(
          "h-1 w-full",
          completed
            ? "bg-success/60"
            : locked
              ? "bg-warning/50"
              : "bg-gradient-primary",
        )}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-4 p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t("student.classNumber", { number: index })}
          </span>
          {statusBadge}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
          {locked && countdownEndsAt !== undefined ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t("student.lockedHint")}
              </span>
              <CountdownTimer
                endsAt={countdownEndsAt}
                onElapsed={onCountdownElapsed}
              />
            </div>
          ) : locked ? (
            <span className="text-xs text-muted-foreground">
              {t("student.lockedHint")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {completed ? t("student.completed") : t("student.unlocked")}
            </span>
          )}

          {locked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              className="rounded-xl"
              data-ocid={`student.open_button.${index}`}
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {t("student.locked")}
            </Button>
          ) : (
            <Button
              asChild
              size="sm"
              className="rounded-xl"
              data-ocid={`student.open_button.${index}`}
            >
              <Link
                to="/student/class/$id"
                params={{ id: classInfo.id.toString() }}
                search={{ studentId: studentId.toString() }}
              >
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {t("student.openClass")}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
