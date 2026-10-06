import { Logo } from "@/components/Logo";
import { useLanguage } from "@/hooks/useLanguage";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  const caffeineHref = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
    typeof window === "undefined" ? "" : window.location.hostname,
  )}`;

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            <Logo size="md" interactive={false} />
            <div
              className="flex items-start gap-3 rounded-2xl border border-border bg-card/60 p-4"
              data-ocid="footer.disclaimer"
            >
              <ShieldCheck
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h2 className="font-display text-sm font-semibold text-foreground">
                  {t("footer.disclaimerTitle")}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("footer.disclaimer")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t("nav.about")}
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#privacy"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                  data-ocid="footer.privacy_link"
                >
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a
                  href="#terms"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                  data-ocid="footer.terms_link"
                >
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a
                  href="#ethics"
                  className="text-muted-foreground transition-smooth hover:text-foreground"
                  data-ocid="footer.ethics_link"
                >
                  {t("footer.ethics")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} HYPNOTISM. {t("footer.rights")}
          </p>
          <p>
            <a
              href={caffeineHref}
              target="_blank"
              rel="noreferrer"
              className="transition-smooth hover:text-foreground"
            >
              {t("footer.builtWith")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
