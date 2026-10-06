import { CountdownControls } from "@/components/admin/CountdownControls";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useClasses,
  useCreateStudent,
  useDeleteStudent,
  useGrantClassAccess,
  useRevokeClassAccess,
  useSetStudentWatermark,
  useStudents,
  useUpdateStudent,
} from "@/hooks/useQueries";
import { formatCountdown } from "@/lib/backend";
import type { Student, StudentInput, StudentView } from "@/types";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface StudentFormState {
  name: string;
  identifier: string;
}

const EMPTY_FORM: StudentFormState = { name: "", identifier: "" };

export function StudentManager() {
  const { t } = useLanguage();
  const { data: students, isLoading, isError, refetch } = useStudents();
  const { data: classes } = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const grantAccess = useGrantClassAccess();
  const revokeAccess = useRevokeClassAccess();
  const setWatermark = useSetStudentWatermark();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({ name: student.name, identifier: student.identifier });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.identifier.trim()) {
      setFormError(t("admin.error.required"));
      return;
    }
    const input: StudentInput = {
      name: form.name.trim(),
      identifier: form.identifier.trim(),
    };
    if (editing) {
      updateStudent.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success(t("admin.students.updated"));
            setDialogOpen(false);
          },
          onError: () => setFormError(t("admin.error.save")),
        },
      );
    } else {
      createStudent.mutate(input, {
        onSuccess: () => {
          toast.success(t("admin.students.created"));
          setDialogOpen(false);
        },
        onError: () => setFormError(t("admin.error.save")),
      });
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteStudent.mutate(pendingDelete.id, {
      onSuccess: () => toast.success(t("admin.students.deleted")),
      onError: () => toast.error(t("admin.error.save")),
    });
    setPendingDelete(null);
  };

  const isSaving = createStudent.isPending || updateStudent.isPending;

  return (
    <div className="flex flex-col gap-6" data-ocid="admin.students.section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("admin.students.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.students.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          data-ocid="admin.students.new_button"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t("admin.students.new")}
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex flex-col gap-4"
          data-ocid="admin.students.loading_state"
        >
          {Array.from({ length: 3 }, (_, i) => `student-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-28 w-full rounded-xl" />
            ),
          )}
        </div>
      ) : isError ? (
        <Card data-ocid="admin.students.error_state">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("admin.error.load")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="admin.students.retry_button"
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : !students || students.length === 0 ? (
        <Card data-ocid="admin.students.empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <GraduationCap
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold">
              {t("admin.students.empty")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("admin.students.emptyBody")}
            </p>
            <Button
              type="button"
              className="mt-2"
              onClick={openCreate}
              data-ocid="admin.students.empty_button"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("admin.students.new")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" data-ocid="admin.students.list">
          {students.map((view, index) => {
            const student = view.student;
            const key = String(student.id);
            const isExpanded = expandedId === key;
            const completed = Number(view.progress.completedClasses.length);
            const total = view.grantedClasses.length;
            return (
              <li key={key}>
                <Card
                  className="transition-smooth hover:border-primary/40"
                  data-ocid={`admin.students.item.${index + 1}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate font-display text-base">
                          {student.name}
                        </CardTitle>
                        <CardDescription className="mt-1 font-mono text-xs">
                          {student.identifier}
                        </CardDescription>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <Badge variant="secondary">
                          {t("admin.students.completed", {
                            done: completed,
                            total,
                          })}
                        </Badge>
                        {student.watermarkEnabled ? (
                          <Badge variant="outline">
                            {t("admin.students.watermark")}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(student)}
                        data-ocid={`admin.students.edit_button.${index + 1}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        {t("admin.students.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(student)}
                        data-ocid={`admin.students.delete_button.${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        {t("admin.students.delete")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => setExpandedId(isExpanded ? null : key)}
                        aria-expanded={isExpanded}
                        data-ocid={`admin.students.manage_button.${index + 1}`}
                      >
                        {t("admin.students.manage")}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          {t("admin.students.countdown")}
                        </span>
                        <span className="font-mono text-sm">
                          {view.progress.remainingSeconds > 0n
                            ? formatCountdown(view.progress.remainingSeconds)
                            : t("admin.students.noCountdown")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor={`watermark-${key}`}
                          className="text-xs text-muted-foreground"
                        >
                          {t("admin.students.watermark")}
                        </Label>
                        <Switch
                          id={`watermark-${key}`}
                          checked={student.watermarkEnabled}
                          onCheckedChange={(checked) =>
                            setWatermark.mutate(
                              { studentId: student.id, enabled: checked },
                              {
                                onSuccess: () =>
                                  toast.success(
                                    checked
                                      ? t("admin.students.watermarkOn")
                                      : t("admin.students.watermarkOff"),
                                  ),
                                onError: () =>
                                  toast.error(t("admin.error.save")),
                              },
                            )
                          }
                          data-ocid={`admin.students.watermark_switch.${index + 1}`}
                        />
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="flex flex-col gap-4 border-t border-border pt-4">
                        <div className="flex flex-col gap-2">
                          <h4 className="font-display text-sm font-semibold">
                            {t("admin.students.access")}
                          </h4>
                          <ul className="flex flex-col gap-2">
                            {(classes ?? []).map((item) => {
                              const granted = view.grantedClasses.some(
                                (id) => id === item.id,
                              );
                              return (
                                <li
                                  key={String(item.id)}
                                  className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                                >
                                  <span className="min-w-0 truncate text-sm">
                                    {item.titleEn}
                                  </span>
                                  <Button
                                    type="button"
                                    variant={granted ? "outline" : "default"}
                                    size="sm"
                                    onClick={() => {
                                      const mutation = granted
                                        ? revokeAccess
                                        : grantAccess;
                                      mutation.mutate(
                                        {
                                          studentId: student.id,
                                          classId: item.id,
                                        },
                                        {
                                          onSuccess: () =>
                                            toast.success(
                                              granted
                                                ? t("admin.students.revoked")
                                                : t("admin.students.granted"),
                                            ),
                                          onError: () =>
                                            toast.error(t("admin.error.save")),
                                        },
                                      );
                                    }}
                                    data-ocid={`admin.students.access_button.${index + 1}`}
                                  >
                                    {granted
                                      ? t("admin.students.revoke")
                                      : t("admin.students.grant")}
                                  </Button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>

                        <CountdownControls student={view} />
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="admin.students.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing
                ? t("admin.students.editTitle")
                : t("admin.students.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.students.subtitle")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="student-name">{t("admin.students.name")}</Label>
              <Input
                id="student-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                data-ocid="admin.students.name_input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="student-identifier">
                {t("admin.students.identifier")}
              </Label>
              <Input
                id="student-identifier"
                value={form.identifier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, identifier: e.target.value }))
                }
                required
                data-ocid="admin.students.identifier_input"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.students.identifierHint")}
              </p>
            </div>
            {formError ? (
              <p
                className="text-sm text-destructive"
                role="alert"
                data-ocid="admin.students.error_state"
              >
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="admin.students.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ocid="admin.students.save_button"
              >
                {isSaving
                  ? t("admin.students.saving")
                  : t("admin.students.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent data-ocid="admin.students.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.students.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.students.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.students.delete_cancel_button">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.students.delete_confirm_button"
            >
              {t("admin.students.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
