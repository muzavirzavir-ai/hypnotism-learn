import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Languages, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Header() {
  const { t, language, toggleLanguage } = useLanguage();
  const { session, role, signOut } = useSession();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardTarget = role === "admin" ? "/admin" : "/student";
  // Carry the signed-in student's identifier so the dashboard can resolve
  // their record instead of landing on the no-student state.
  const dashboardSearch =
    role === "student" && session?.identifier
      ? { identifier: session.identifier }
      : undefined;

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    void navigate({ to: "/" });
  };

  const navLinkClass =
    "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground hover:bg-muted/60";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" aria-label="HYPNOTISM home" data-ocid="nav.home_link">
            <Logo size="md" />
          </Link>
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            <Link
              to="/"
              className={navLinkClass}
              activeProps={{
                className: cn(navLinkClass, "text-foreground bg-muted/60"),
              }}
              data-ocid="nav.home_link"
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/student"
              search={dashboardSearch}
              className={navLinkClass}
              activeProps={{
                className: cn(navLinkClass, "text-foreground bg-muted/60"),
              }}
              data-ocid="nav.dashboard_link"
            >
              {t("nav.dashboard")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            aria-label={t("lang.switchTo")}
            data-ocid="lang.toggle"
            className="gap-1.5"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span className="font-mono text-xs uppercase">
              {language === "en" ? "EN" : "ML"}
            </span>
          </Button>

          {session ? (
            <div className="hidden items-center gap-2 md:flex">
              <span
                className="text-sm text-muted-foreground"
                data-ocid="session.role_label"
              >
                {t("session.signedInAs", {
                  role: t(role === "admin" ? "role.admin" : "role.student"),
                })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void navigate({ to: dashboardTarget })}
                data-ocid="nav.dashboard_button"
              >
                {t("nav.dashboard")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleSignOut()}
                data-ocid="nav.signout_button"
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("nav.signOut")}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => void navigate({ to: "/" })}
              data-ocid="nav.signin_button"
              className="hidden md:inline-flex"
            >
              {t("nav.signIn")}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            data-ocid="nav.menu_toggle"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <nav
          className="border-t border-border bg-card px-4 py-3 md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-1">
            <Link
              to="/"
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
              data-ocid="nav.home_link"
            >
              {t("nav.home")}
            </Link>
            <Link
              to="/student"
              search={dashboardSearch}
              className={navLinkClass}
              onClick={() => setMenuOpen(false)}
              data-ocid="nav.dashboard_link"
            >
              {t("nav.dashboard")}
            </Link>
            {session ? (
              <>
                <Link
                  to={dashboardTarget}
                  search={dashboardSearch}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                  data-ocid="nav.dashboard_button"
                >
                  {t("nav.dashboard")}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className={cn(navLinkClass, "text-left")}
                  data-ocid="nav.signout_button"
                >
                  {t("nav.signOut")}
                </button>
              </>
            ) : null}
          </div>
        </nav>
      )}
    </header>
  );
}
