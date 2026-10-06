import { AuditAction } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuditLog } from "@/hooks/useQueries";
import { formatTimestamp } from "@/lib/backend";
import { RefreshCw, ShieldCheck } from "lucide-react";

const ACTION_LABEL_KEYS: Record<
  AuditAction,
  | "admin.audit.action.signIn"
  | "admin.audit.action.signOut"
  | "admin.audit.action.failedKey"
  | "admin.audit.action.classCreated"
  | "admin.audit.action.classUpdated"
  | "admin.audit.action.classDeleted"
  | "admin.audit.action.classPublished"
  | "admin.audit.action.classLocked"
  | "admin.audit.action.classUnlocked"
  | "admin.audit.action.lessonChanged"
  | "admin.audit.action.mediaChanged"
  | "admin.audit.action.studentChanged"
  | "admin.audit.action.accessGranted"
  | "admin.audit.action.accessRevoked"
  | "admin.audit.action.countdownOverridden"
  | "admin.audit.action.countdownReset"
  | "admin.audit.action.watermarkToggled"
> = {
  [AuditAction.signIn]: "admin.audit.action.signIn",
  [AuditAction.signOut]: "admin.audit.action.signOut",
  [AuditAction.failedKey]: "admin.audit.action.failedKey",
  [AuditAction.classCreated]: "admin.audit.action.classCreated",
  [AuditAction.classUpdated]: "admin.audit.action.classUpdated",
  [AuditAction.classDeleted]: "admin.audit.action.classDeleted",
  [AuditAction.classPublished]: "admin.audit.action.classPublished",
  [AuditAction.classLocked]: "admin.audit.action.classLocked",
  [AuditAction.classUnlocked]: "admin.audit.action.classUnlocked",
  [AuditAction.lessonChanged]: "admin.audit.action.lessonChanged",
  [AuditAction.mediaChanged]: "admin.audit.action.mediaChanged",
  [AuditAction.studentChanged]: "admin.audit.action.studentChanged",
  [AuditAction.accessGranted]: "admin.audit.action.accessGranted",
  [AuditAction.accessRevoked]: "admin.audit.action.accessRevoked",
  [AuditAction.countdownOverridden]: "admin.audit.action.countdownOverridden",
  [AuditAction.countdownReset]: "admin.audit.action.countdownReset",
  [AuditAction.watermarkToggled]: "admin.audit.action.watermarkToggled",
};

const DESTRUCTIVE_ACTIONS: AuditAction[] = [
  AuditAction.failedKey,
  AuditAction.classDeleted,
  AuditAction.accessRevoked,
];

/** Read-only security and audit activity feed. */
export function AuditLog() {
  const { t } = useLanguage();
  const {
    data: entries,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useAuditLog(100);

  return (
    <div className="flex flex-col gap-6" data-ocid="admin.audit.section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("admin.audit.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.audit.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          data-ocid="admin.audit.refresh_button"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {t("admin.audit.refresh")}
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex flex-col gap-2"
          data-ocid="admin.audit.loading_state"
        >
          {Array.from({ length: 6 }, (_, i) => `audit-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-12 w-full rounded-lg" />
            ),
          )}
        </div>
      ) : isError ? (
        <Card data-ocid="admin.audit.error_state">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("admin.error.load")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="admin.audit.retry_button"
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : !entries || entries.length === 0 ? (
        <Card data-ocid="admin.audit.empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ShieldCheck
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold">
              {t("admin.audit.empty")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("admin.audit.emptyBody")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card data-ocid="admin.audit.table">
          <CardHeader>
            <CardTitle className="font-display text-base">
              {t("admin.audit.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.audit.when")}</TableHead>
                  <TableHead>{t("admin.audit.action")}</TableHead>
                  <TableHead>{t("admin.audit.detail")}</TableHead>
                  <TableHead className="text-right">
                    {t("admin.audit.actor")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, index) => {
                  const isDestructive = DESTRUCTIVE_ACTIONS.includes(
                    entry.action,
                  );
                  return (
                    <TableRow
                      key={String(entry.id)}
                      data-ocid={`admin.audit.row.${index + 1}`}
                    >
                      <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                        {formatTimestamp(entry.at)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isDestructive ? "destructive" : "secondary"}
                        >
                          {t(ACTION_LABEL_KEYS[entry.action])}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm">
                        {entry.detail || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">
                        {entry.actorPrincipal.toText().slice(0, 12)}…
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
