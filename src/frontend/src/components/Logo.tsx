import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";

const TAP_WINDOW_MS = 900;
const REQUIRED_TAPS = 3;

interface LogoProps {
  /** Rendered size of the wordmark. */
  size?: "sm" | "md" | "lg";
  /** When false, the logo is decorative and not interactive. */
  interactive?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

/**
 * HYPNOTISM wordmark. Tapping it three times within a short window
 * navigates to the hidden Admin Access page.
 */
export function Logo({
  size = "md",
  interactive = true,
  className,
}: LogoProps) {
  const navigate = useNavigate();
  const tapsRef = useRef<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = useCallback(() => {
    const now = Date.now();
    tapsRef.current = [...tapsRef.current, now].filter(
      (at) => now - at <= TAP_WINDOW_MS,
    );

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      tapsRef.current = [];
    }, TAP_WINDOW_MS);

    if (tapsRef.current.length >= REQUIRED_TAPS) {
      tapsRef.current = [];
      if (timerRef.current) clearTimeout(timerRef.current);
      void navigate({ to: "/admin-access" });
    }
  }, [navigate]);

  const wordmark = (
    <span
      className={cn(
        "font-display font-bold tracking-tight text-gradient-primary select-none",
        sizeClasses[size],
      )}
    >
      HYPNOTISM
    </span>
  );

  if (!interactive) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        {wordmark}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label="HYPNOTISM home"
      data-ocid="logo.button"
      className={cn(
        "inline-flex items-center rounded-lg px-1 py-0.5 transition-smooth hover:opacity-90 focus-visible:outline-none",
        className,
      )}
    >
      {wordmark}
    </button>
  );
}
