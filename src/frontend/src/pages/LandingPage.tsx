import { HeroSection } from "@/components/HeroSection";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Lock,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";

type JourneyState = "unlocked" | "locked" | "completed";

interface JourneyClass {
  id: string;
  titleKey: "landing.class1" | "landing.class2" | "landing.class3";
  descKey: "landing.class1Desc" | "landing.class2Desc" | "landing.class3Desc";
  state: JourneyState;
  duration: string;
}

const JOURNEY: JourneyClass[] = [
  {
    id: "foundations",
    titleKey: "landing.class1",
    descKey: "landing.class1Desc",
    state: "completed",
    duration: "00:22:53",
  },
  {
    id: "conversational",
    titleKey: "landing.class2",
    descKey: "landing.class2Desc",
    state: "unlocked",
    duration: "00:32:23",
  },
  {
    id: "deep-relaxation",
    titleKey: "landing.class3",
    descKey: "landing.class3Desc",
    state: "locked",
    duration: "00:23:53",
  },
];

const STATE_STYLES: Record<
  JourneyState,
  {
    badge: string;
    icon: typeof Lock;
    labelKey:
      | "landing.stateUnlocked"
      | "landing.stateLocked"
      | "landing.stateCompleted";
  }
> = {
  completed: {
    badge: "border-success/30 bg-success/15 text-success",
    icon: CheckCircle2,
    labelKey: "landing.stateCompleted",
  },
  unlocked: {
    badge: "border-primary/30 bg-primary/15 text-primary",
    icon: PlayCircle,
    labelKey: "landing.stateUnlocked",
  },
  locked: {
    badge: "border-warning/30 bg-warning/15 text-warning",
    icon: Lock,
    labelKey: "landing.stateLocked",
  },
};

/** Landing page — brand hero, student access, and a learning-journey preview. */
export function LandingPage() {
  const { t } = useLanguage();

  return (
    <div data-ocid="landing.page">
      <HeroSection />

      {/* Learning journey preview */}
      <section
        className="bg-muted/30 py-16 md:py-24"
        data-ocid="landing.journey_section"
      >
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("landing.journeyEyebrow")}
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-4xl">
              {t("landing.journeyTitle")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("landing.journeySubtitle")}
            </p>
          </div>

          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {JOURNEY.map((item, index) => {
              const style = STATE_STYLES[item.state];
              const StateIcon = style.icon;
              return (
                <li
                  key={item.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <article
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-subtle transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated",
                      item.state === "locked" && "opacity-90",
                    )}
                    data-ocid={`landing.class_card.${index + 1}`}
                  >
                    <div
                      aria-hidden="true"
                      className="h-1 w-full bg-gradient-primary"
                    />
                    <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            style.badge,
                          )}
                          data-ocid={`landing.class_state.${index + 1}`}
                        >
                          <StateIcon className="h-3 w-3" aria-hidden="true" />
                          {t(style.labelKey)}
                        </Badge>
                        <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {item.duration}
                        </span>
                      </div>

                      <div className="flex-1 space-y-2">
                        <h3 className="font-display text-lg font-semibold leading-snug tracking-tight">
                          {t(item.titleKey)}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t(item.descKey)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 border-t border-border pt-4 text-xs font-medium text-muted-foreground">
                        {item.state === "locked" ? (
                          <>
                            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                            {t("landing.lockedHint")}
                          </>
                        ) : (
                          <>
                            <PlayCircle
                              className="h-3.5 w-3.5 text-primary"
                              aria-hidden="true"
                            />
                            {t("landing.availableHint")}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          <p className="mt-10 flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            {t("landing.journeyNote")}
          </p>
        </div>
      </section>
    </div>
  );
}
