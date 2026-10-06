import { createActor } from "@/backend";
import { AccessKeyForm } from "@/components/AccessKeyForm";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, Lock, Sparkles } from "lucide-react";
import { useCallback } from "react";

/**
 * Landing hero: brand, bilingual intro, and the student access-key form,
 * set against the signature indigo→violet focus beam and grid texture.
 */
export function HeroSection() {
  const { t } = useLanguage();
  const { session, role } = useSession();
  const { actor } = useActor(createActor);
  const navigate = useNavigate();

  /**
   * Resolve the signed-in student's record so the dashboard can load their
   * classes. The student access key is shared, so the student self-identifies
   * with the identifier their instructor issued; `resolveStudent` matches it
   * against the caller's own record and binds it to this principal. If no
   * record can be resolved we still navigate to the dashboard, which shows a
   * clear "no student profile" message.
   */
  const resolveStudentId = useCallback(
    async (identifier: string): Promise<bigint | null> => {
      if (!actor) return null;
      const needle = identifier.trim();
      if (!needle) return null;
      try {
        const self = await actor.resolveStudent(needle);
        return self ? self.id : null;
      } catch {
        return null;
      }
    },
    [actor],
  );

  const handleSuccess = useCallback(
    async (identifier: string) => {
      const studentId = await resolveStudentId(identifier);
      void navigate({
        to: "/student",
        search: studentId !== null ? { studentId: studentId.toString() } : {},
      });
    },
    [navigate, resolveStudentId],
  );

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      data-ocid="landing.hero_section"
    >
      {/* Focus beam + grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-fade"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ backgroundImage: "var(--gradient-primary)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 animate-float rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:gap-10 md:px-6 md:py-24 lg:gap-16">
        <div className="animate-fade-up space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t("app.name")}
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
            <span className="text-gradient-primary">{t("app.tagline")}</span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t("landing.intro")}
          </p>

          <dl className="grid max-w-md grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("landing.statClasses")}
              </dt>
              <dd className="font-display text-2xl font-bold text-foreground">
                12
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("landing.statLessons")}
              </dt>
              <dd className="font-display text-2xl font-bold text-foreground">
                48
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("landing.statEthical")}
              </dt>
              <dd className="font-display text-2xl font-bold text-foreground">
                100%
              </dd>
            </div>
          </dl>
        </div>

        <div
          className="animate-fade-up rounded-2xl border border-border bg-card/80 p-6 shadow-elevated backdrop-blur-sm md:p-8"
          style={{ animationDelay: "120ms" }}
          data-ocid="landing.access_card"
        >
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-display text-xl font-bold tracking-tight">
                {t("access.title")}
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("access.subtitle")}
            </p>
          </div>

          {session ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
                <Lock className="h-4 w-4" aria-hidden="true" />
                {t("session.signedInAs", {
                  role: t(role === "admin" ? "role.admin" : "role.student"),
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (role === "admin") {
                    void navigate({ to: "/admin" });
                    return;
                  }
                  void handleSuccess(session.identifier ?? "");
                }}
                className="h-11 w-full rounded-xl bg-gradient-primary font-semibold text-white shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-floating"
                data-ocid="landing.continue_button"
              >
                {t("common.continue")}
              </button>
            </div>
          ) : (
            <AccessKeyForm
              kind="student"
              labelKey="access.keyLabel"
              placeholderKey="access.keyPlaceholder"
              submitKey="access.submit"
              collectIdentifier
              onSuccess={(identifier) => void handleSuccess(identifier)}
            />
          )}
        </div>
      </div>
    </section>
  );
}
