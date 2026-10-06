import { cn } from "@/lib/utils";

interface WatermarkOverlayProps {
  /** The student's identifier, tiled across the protected media. */
  identifier: string;
  className?: string;
}

/**
 * Non-interactive watermark tiled over protected media. Purely decorative
 * for deterrence; it never blocks pointer events on the media beneath it.
 */
export function WatermarkOverlay({
  identifier,
  className,
}: WatermarkOverlayProps) {
  const label = identifier.trim() || "student";
  const tiles = Array.from({ length: 12 }, (_, i) => `wm-${i}`);

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 grid grid-cols-3 grid-rows-4 overflow-hidden select-none",
        className,
      )}
      aria-hidden="true"
      data-ocid="media.watermark"
    >
      {tiles.map((id) => (
        <span
          key={id}
          className="flex items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-foreground/25 mix-blend-overlay"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
