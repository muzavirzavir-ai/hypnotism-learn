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
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
  useReorderClasses,
  useSetClassLocked,
  useSetClassPublished,
  useUpdateClass,
} from "@/hooks/useQueries";
import type { Class, ClassId, ClassInput } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ClassFormState {
  titleEn: string;
  titleMl: string;
  descriptionEn: string;
  descriptionMl: string;
  published: boolean;
}

const EMPTY_FORM: ClassFormState = {
  titleEn: "",
  titleMl: "",
  descriptionEn: "",
  descriptionMl: "",
  published: false,
};

function toInput(form: ClassFormState): ClassInput {
  return {
    titleEn: form.titleEn.trim(),
    titleMl: form.titleMl.trim(),
    descriptionEn: form.descriptionEn.trim(),
    descriptionMl: form.descriptionMl.trim(),
    published: form.published,
  };
}

export function ClassManager() {
  const { t } = useLanguage();
  const { data: classes, isLoading, isError, refetch } = useClasses();
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const setPublished = useSetClassPublished();
  const setLocked = useSetClassLocked();
  const reorder = useReorderClasses();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);
  const [form, setForm] = useState<ClassFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Class | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (item: Class) => {
    setEditing(item);
    setForm({
      titleEn: item.titleEn,
      titleMl: item.titleMl,
      descriptionEn: item.descriptionEn,
      descriptionMl: item.descriptionMl,
      published: item.published,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.titleEn.trim() || !form.titleMl.trim()) {
      setFormError(t("admin.error.required"));
      return;
    }
    const input = toInput(form);
    if (editing) {
      updateClass.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success(t("admin.classes.updated"));
            setDialogOpen(false);
          },
          onError: () => setFormError(t("admin.error.save")),
        },
      );
    } else {
      createClass.mutate(input, {
        onSuccess: () => {
          toast.success(t("admin.classes.created"));
          setDialogOpen(false);
        },
        onError: () => setFormError(t("admin.error.save")),
      });
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if (!classes) return;
    const target = index + direction;
    if (target < 0 || target >= classes.length) return;
    const ordered = classes.map((item) => item.id);
    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);
    reorder.mutate(ordered, {
      onSuccess: () => toast.success(t("admin.classes.reordered")),
      onError: () => toast.error(t("admin.error.save")),
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteClass.mutate(pendingDelete.id, {
      onSuccess: () => toast.success(t("admin.classes.deleted")),
      onError: () => toast.error(t("admin.error.save")),
    });
    setPendingDelete(null);
  };

  const isSaving = createClass.isPending || updateClass.isPending;

  return (
    <div className="flex flex-col gap-6" data-ocid="admin.classes.section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("admin.classes.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.classes.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={openCreate}
          data-ocid="admin.classes.new_button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("admin.classes.new")}
        </Button>
      </div>

      {isLoading ? (
        <div
          className="grid gap-4 md:grid-cols-2"
          data-ocid="admin.classes.loading_state"
        >
          {Array.from({ length: 4 }, (_, i) => `class-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-40 w-full rounded-xl" />
            ),
          )}
        </div>
      ) : isError ? (
        <Card data-ocid="admin.classes.error_state">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("admin.error.load")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="admin.classes.retry_button"
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : !classes || classes.length === 0 ? (
        <Card data-ocid="admin.classes.empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <BookOpen
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold">
              {t("admin.classes.empty")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("admin.classes.emptyBody")}
            </p>
            <Button
              type="button"
              className="mt-2"
              onClick={openCreate}
              data-ocid="admin.classes.empty_button"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("admin.classes.new")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul
          className="grid gap-4 md:grid-cols-2"
          data-ocid="admin.classes.list"
        >
          {classes.map((item, index) => (
            <li key={String(item.id)}>
              <Card
                className="h-full transition-smooth hover:border-primary/40"
                data-ocid={`admin.classes.item.${index + 1}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate font-display text-base">
                        {item.titleEn}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {item.descriptionEn || "—"}
                      </CardDescription>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={item.published ? "default" : "secondary"}>
                      {item.published
                        ? t("admin.classes.published")
                        : t("admin.classes.draft")}
                    </Badge>
                    <Badge variant={item.locked ? "destructive" : "outline"}>
                      {item.locked
                        ? t("admin.classes.locked")
                        : t("admin.classes.unlocked")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPublished.mutate(
                          { id: item.id, published: !item.published },
                          {
                            onSuccess: () =>
                              toast.success(
                                item.published
                                  ? t("admin.classes.updated")
                                  : t("admin.classes.updated"),
                              ),
                            onError: () => toast.error(t("admin.error.save")),
                          },
                        )
                      }
                      data-ocid={`admin.classes.publish_button.${index + 1}`}
                    >
                      {item.published
                        ? t("admin.classes.unpublish")
                        : t("admin.classes.publish")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLocked.mutate(
                          { id: item.id, locked: !item.locked },
                          {
                            onSuccess: () =>
                              toast.success(t("admin.classes.updated")),
                            onError: () => toast.error(t("admin.error.save")),
                          },
                        )
                      }
                      data-ocid={`admin.classes.lock_button.${index + 1}`}
                    >
                      {item.locked ? (
                        <LockOpen className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Lock className="h-4 w-4" aria-hidden="true" />
                      )}
                      {item.locked
                        ? t("admin.classes.unlock")
                        : t("admin.classes.lock")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}
                      data-ocid={`admin.classes.edit_button.${index + 1}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t("admin.classes.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(item)}
                      data-ocid={`admin.classes.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t("admin.classes.delete")}
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0 || reorder.isPending}
                        aria-label={t("admin.classes.moveUp")}
                        onClick={() => handleMove(index, -1)}
                        data-ocid={`admin.classes.move_up_button.${index + 1}`}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={
                          index === classes.length - 1 || reorder.isPending
                        }
                        aria-label={t("admin.classes.moveDown")}
                        onClick={() => handleMove(index, 1)}
                        data-ocid={`admin.classes.move_down_button.${index + 1}`}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-ocid="admin.classes.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing
                ? t("admin.classes.editTitle")
                : t("admin.classes.createTitle")}
            </DialogTitle>
            <DialogDescription>{t("admin.classes.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="class-title-en">
                  {t("admin.classes.titleEn")}
                </Label>
                <Input
                  id="class-title-en"
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleEn: e.target.value }))
                  }
                  required
                  data-ocid="admin.classes.title_en_input"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="class-title-ml">
                  {t("admin.classes.titleMl")}
                </Label>
                <Input
                  id="class-title-ml"
                  value={form.titleMl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleMl: e.target.value }))
                  }
                  required
                  data-ocid="admin.classes.title_ml_input"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-desc-en">
                {t("admin.classes.descriptionEn")}
              </Label>
              <Textarea
                id="class-desc-en"
                value={form.descriptionEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionEn: e.target.value }))
                }
                rows={3}
                data-ocid="admin.classes.description_en_input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="class-desc-ml">
                {t("admin.classes.descriptionMl")}
              </Label>
              <Textarea
                id="class-desc-ml"
                value={form.descriptionMl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, descriptionMl: e.target.value }))
                }
                rows={3}
                data-ocid="admin.classes.description_ml_input"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
              <Label htmlFor="class-published" className="cursor-pointer">
                {t("admin.classes.publishNow")}
              </Label>
              <Switch
                id="class-published"
                checked={form.published}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, published: checked }))
                }
                data-ocid="admin.classes.published_switch"
              />
            </div>
            {formError ? (
              <p
                className="text-sm text-destructive"
                role="alert"
                data-ocid="admin.classes.error_state"
              >
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="admin.classes.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ocid="admin.classes.save_button"
              >
                {isSaving ? t("admin.classes.saving") : t("admin.classes.save")}
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
        <AlertDialogContent data-ocid="admin.classes.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.classes.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.classes.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.classes.delete_cancel_button">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.classes.delete_confirm_button"
            >
              {t("admin.classes.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
