import { AccessKeyForm } from "@/components/AccessKeyForm";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { useNavigate } from "@tanstack/react-router";
import { KeyRound, ShieldAlert } from "lucide-react";

/**
 * Hidden admin access page, reachable only through the triple-tap logo
 * gesture. Verifies the admin access key and redirects to the console.
 */
export function AdminAccessPage() {
  const { t } = useLanguage();
  const { session, role } = useSession();
  const navigate = useNavigate();

  const handleSuccess = () => {
    void navigate({ to: "/admin" });
  };

  return (
    <section className="relative overflow-hidden" data-ocid="admin_access.page">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-grid-fade"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-accent/20 opacity-40 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-7xl justify-center px-4 py-16 md:px-6 md:py-24">
        <div
          className="w-full max-w-md animate-scale-in rounded-2xl border border-border bg-card/90 p-6 shadow-floating backdrop-blur-sm md:p-8"
          data-ocid="admin_access.card"
        >
          <div className="mb-6 space-y-3 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              {t("adminAccess.title")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("adminAccess.subtitle")}
            </p>
          </div>

          <div
            className="mb-6 flex items-start gap-2.5 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5 text-sm text-warning"
            data-ocid="admin_access.warning"
          >
            <ShieldAlert
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>{t("adminAccess.warning")}</span>
          </div>

          {session && role === "admin" ? (
            <div className="space-y-4">
              <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2.5 text-center text-sm text-success">
                {t("session.signedInAs", { role: t("role.admin") })}
              </p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/admin" })}
                className="h-11 w-full rounded-xl bg-gradient-primary font-semibold text-white shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-floating"
                data-ocid="admin_access.continue_button"
              >
                {t("common.continue")}
              </button>
            </div>
          ) : (
            <AccessKeyForm
              kind="admin"
              labelKey="adminAccess.keyLabel"
              placeholderKey="adminAccess.keyPlaceholder"
              submitKey="adminAccess.submit"
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </div>
    </section>
  );
}
