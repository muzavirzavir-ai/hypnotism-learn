import { AuditLog } from "@/components/admin/AuditLog";
import { ClassManager } from "@/components/admin/ClassManager";
import { LessonManager } from "@/components/admin/LessonManager";
import { StudentManager } from "@/components/admin/StudentManager";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, GraduationCap, ScrollText, ShieldCheck } from "lucide-react";
import { useEffect } from "react";

/**
 * Private admin console. Non-admin visitors are redirected to the admin
 * access gate; the backend re-checks the role on every mutation.
 */
export function AdminDashboardPage() {
  const { t } = useLanguage();
  const { role, isRestoring } = useSession();
  const navigate = useNavigate();

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isRestoring && !isAdmin) {
      void navigate({ to: "/admin-access" });
    }
  }, [isRestoring, isAdmin, navigate]);

  if (isRestoring) {
    return (
      <section
        className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24"
        data-ocid="admin.loading_state"
      >
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-6 h-10 w-full max-w-xl" />
        <Skeleton className="mt-6 h-64 w-full" />
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section
        className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center md:px-6"
        data-ocid="admin.denied_state"
      >
        <ShieldCheck
          className="h-10 w-10 text-muted-foreground"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
          {t("admin.deniedTitle")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {t("admin.deniedBody")}
        </p>
        <Button
          type="button"
          className="mt-6"
          onClick={() => void navigate({ to: "/admin-access" })}
          data-ocid="admin.denied_button"
        >
          {t("admin.deniedAction")}
        </Button>
      </section>
    );
  }

  return (
    <section
      className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14"
      data-ocid="admin.page"
    >
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          {t("admin.eyebrow")}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {t("admin.title")}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("admin.subtitle")}
        </p>
      </header>

      <Tabs defaultValue="classes" className="mt-8 gap-6">
        <TabsList
          className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1"
          data-ocid="admin.tabs"
        >
          <TabsTrigger
            value="classes"
            className="gap-2 px-3 py-2"
            data-ocid="admin.classes.tab"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            {t("admin.tab.classes")}
          </TabsTrigger>
          <TabsTrigger
            value="lessons"
            className="gap-2 px-3 py-2"
            data-ocid="admin.lessons.tab"
          >
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            {t("admin.tab.lessons")}
          </TabsTrigger>
          <TabsTrigger
            value="students"
            className="gap-2 px-3 py-2"
            data-ocid="admin.students.tab"
          >
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {t("admin.tab.students")}
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="gap-2 px-3 py-2"
            data-ocid="admin.activity.tab"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {t("admin.tab.activity")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes" data-ocid="admin.classes.panel">
          <ClassManager />
        </TabsContent>
        <TabsContent value="lessons" data-ocid="admin.lessons.panel">
          <LessonManager />
        </TabsContent>
        <TabsContent value="students" data-ocid="admin.students.panel">
          <StudentManager />
        </TabsContent>
        <TabsContent value="activity" data-ocid="admin.activity.panel">
          <AuditLog />
        </TabsContent>
      </Tabs>
    </section>
  );
}
