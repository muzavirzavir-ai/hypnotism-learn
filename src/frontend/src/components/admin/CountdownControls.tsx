import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useClasses,
  useOverrideCountdown,
  useResetCountdown,
  useSetClassLockForStudent,
} from "@/hooks/useQueries";
import { formatCountdown } from "@/lib/backend";
import type { ClassId, StudentId, StudentView } from "@/types";
import { Lock, LockOpen, RotateCcw, TimerReset } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CountdownControlsProps {
  student: StudentView;
}

/**
 * Per-student lock and countdown overrides. The countdown is expressed in
 * hours from now and converted to a backend nanosecond timestamp.
 */
export function CountdownControls({ student }: CountdownControlsProps) {
  const { t } = useLanguage();
  const { data: classes } = useClasses();
  const setLock = useSetClassLockForStudent();
  const override = useOverrideCountdown();
  const reset = useResetCountdown();

  const [classId, setClassId] = useState<ClassId | null>(null);
  const [hours, setHours] = useState("24");

  const activeClassId = classId ?? classes?.[0]?.id ?? null;
  const progress = student.progress;
  const isLocked = progress.currentClassId === activeClassId;

  const handleLockToggle = () => {
    if (!activeClassId) return;
    setLock.mutate(
      {
        studentId: student.student.id,
        classId: activeClassId,
        locked: !isLocked,
      },
      {
        onSuccess: () =>
          toast.success(
            isLocked
              ? t("admin.countdown.unlocked")
              : t("admin.countdown.locked"),
          ),
        onError: () => toast.error(t("admin.error.save")),
      },
    );
  };

  const handleOverride = () => {
    if (!activeClassId) return;
    const parsed = Number(hours);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error(t("admin.error.required"));
      return;
    }
    const endsAt = BigInt(Date.now() + parsed * 3_600_000) * 1_000_000n;
    override.mutate(
      { studentId: student.student.id, classId: activeClassId, endsAt },
      {
        onSuccess: () => toast.success(t("admin.countdown.overridden")),
        onError: () => toast.error(t("admin.error.save")),
      },
    );
  };

  const handleReset = () => {
    if (!activeClassId) return;
    reset.mutate(
      { studentId: student.student.id, classId: activeClassId },
      {
        onSuccess: () => toast.success(t("admin.countdown.resetDone")),
        onError: () => toast.error(t("admin.error.save")),
      },
    );
  };

  const isBusy = setLock.isPending || override.isPending || reset.isPending;

  return (
    <div
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4"
      data-ocid="admin.countdown.panel"
    >
      <div>
        <h4 className="font-display text-sm font-semibold">
          {t("admin.countdown.title")}
        </h4>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("admin.countdown.subtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`countdown-class-${student.student.id}`}>
          {t("admin.countdown.class")}
        </Label>
        <Select
          value={activeClassId ? String(activeClassId) : undefined}
          onValueChange={(value) => setClassId(BigInt(value))}
        >
          <SelectTrigger
            id={`countdown-class-${student.student.id}`}
            className="w-full"
            data-ocid="admin.countdown.class_select"
          >
            <SelectValue placeholder={t("admin.countdown.selectClass")} />
          </SelectTrigger>
          <SelectContent>
            {(classes ?? []).map((item) => (
              <SelectItem key={String(item.id)} value={String(item.id)}>
                {item.titleEn}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between rounded-md bg-background/60 px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {t("admin.countdown.remaining")}
        </span>
        <span className="font-mono text-sm">
          {progress.remainingSeconds > 0n
            ? formatCountdown(progress.remainingSeconds)
            : t("admin.students.noCountdown")}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!activeClassId || isBusy}
          onClick={handleLockToggle}
          data-ocid="admin.countdown.lock_button"
        >
          {isLocked ? (
            <LockOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Lock className="h-4 w-4" aria-hidden="true" />
          )}
          {isLocked ? t("admin.countdown.unlock") : t("admin.countdown.lock")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!activeClassId || isBusy}
          onClick={handleReset}
          data-ocid="admin.countdown.reset_button"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {t("admin.countdown.reset")}
        </Button>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <Label htmlFor={`countdown-hours-${student.student.id}`}>
          {t("admin.countdown.hours")}
        </Label>
        <div className="flex gap-2">
          <Input
            id={`countdown-hours-${student.student.id}`}
            type="number"
            min={0}
            step={1}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-28"
            data-ocid="admin.countdown.hours_input"
          />
          <Button
            type="button"
            size="sm"
            disabled={!activeClassId || isBusy}
            onClick={handleOverride}
            data-ocid="admin.countdown.override_button"
          >
            <TimerReset className="h-4 w-4" aria-hidden="true" />
            {t("admin.countdown.apply")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("admin.countdown.overrideHint")}
        </p>
      </div>
    </div>
  );
}
