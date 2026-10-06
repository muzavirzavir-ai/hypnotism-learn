import { formatCountdown, timestampToDate } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CountdownTimerProps {
  /** Server-provided countdown end timestamp (nanosecond bigint). */
  endsAt: bigint;
  /** Called once when the countdown reaches zero so the caller can refetch. */
  onElapsed?: () => void;
  className?: string;
  /** Compact variant for cards; full variant for the dashboard hero. */
  size?: "sm" | "lg";
}

/**
 * Live remaining-time display driven by the server-provided `endsAt`
 * timestamp. The remaining duration is always derived from the server value;
 * the client clock only measures elapsed wall-clock time between ticks. The
 * backend remains authoritative, so a tampered device clock cannot actually
 * unlock the next class — the UI simply re-fetches when it reaches zero.
 */
export function CountdownTimer({
  endsAt,
  onElapsed,
  className,
  size = "sm",
}: CountdownTimerProps) {
  const targetMs = timestampToDate(endsAt)?.getTime() ?? null;

  const [remaining, setRemaining] = useState<number>(() =>
    targetMs === null
      ? 0
      : Math.max(0, Math.ceil((targetMs - Date.now()) / 1000)),
  );
  const elapsedRef = useRef(false);

  useEffect(() => {
    elapsedRef.current = false;
    const compute = () =>
      targetMs === null
        ? 0
        : Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));

    setRemaining(compute());

    const interval = window.setInterval(() => {
      const next = compute();
      setRemaining(next);
      if (next <= 0 && !elapsedRef.current) {
        elapsedRef.current = true;
        window.clearInterval(interval);
        onElapsed?.();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [targetMs, onElapsed]);

  const isLarge = size === "lg";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-warning/30 bg-warning/10 text-warning",
        isLarge ? "px-4 py-2" : "px-2.5 py-1",
        className,
      )}
      role="timer"
      aria-live="off"
      data-ocid="countdown.timer"
    >
      <Clock
        className={cn(isLarge ? "h-4 w-4" : "h-3.5 w-3.5")}
        aria-hidden="true"
      />
      <span
        className={cn(
          "font-mono font-semibold tabular-nums tracking-tight",
          isLarge ? "text-lg" : "text-xs",
        )}
      >
        {formatCountdown(remaining)}
      </span>
    </div>
  );
}
