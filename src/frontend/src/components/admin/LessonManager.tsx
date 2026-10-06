import { MediaUploader } from "@/components/admin/MediaUploader";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import {
  useClasses,
  useCreateLesson,
  useDeleteLesson,
  useLessons,
  useRemoveLessonMedia,
  useUpdateLesson,
} from "@/hooks/useQueries";
import type { ClassId, Lesson, LessonInput } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  ScrollText,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LessonFormState {
  titleEn: string;
  titleMl: string;
  bodyEn: string;
  bodyMl: string;
}

const EMPTY_FORM: LessonFormState = {
  titleEn: "",
  titleMl: "",
  bodyEn: "",
  bodyMl: "",
};

export function LessonManager() {
  const { t } = useLanguage();
  const { data: classes } = useClasses();
  const [selectedClassId, setSelectedClassId] = useState<ClassId | null>(null);
  const activeClassId = selectedClassId ?? classes?.[0]?.id ?? null;
  const {
    data: lessons,
    isLoading,
    isError,
    refetch,
  } = useLessons(activeClassId);

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const removeMedia = useRemoveLessonMedia();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState<LessonFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lesson | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (lesson: Lesson) => {
    setEditing(lesson);
    setForm({
      titleEn: lesson.titleEn,
      titleMl: lesson.titleMl,
      bodyEn: lesson.bodyEn,
      bodyMl: lesson.bodyMl,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeClassId) return;
    if (!form.titleEn.trim() || !form.titleMl.trim()) {
      setFormError(t("admin.error.required"));
      return;
    }
    const input: LessonInput = {
      classId: activeClassId,
      titleEn: form.titleEn.trim(),
      titleMl: form.titleMl.trim(),
      bodyEn: form.bodyEn.trim(),
      bodyMl: form.bodyMl.trim(),
    };
    if (editing) {
      updateLesson.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success(t("admin.lessons.updated"));
            setDialogOpen(false);
          },
          onError: () => setFormError(t("admin.error.save")),
        },
      );
    } else {
      createLesson.mutate(input, {
        onSuccess: () => {
          toast.success(t("admin.lessons.created"));
          setDialogOpen(false);
        },
        onError: () => setFormError(t("admin.error.save")),
      });
    }
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    if (!lessons || !activeClassId) return;
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const ordered = lessons.map((lesson) => lesson.id);
    const [moved] = ordered.splice(index, 1);
    ordered.splice(target, 0, moved);
    // Lessons are reordered by rewriting their order via updateLesson.
    const reordered = ordered.map((id, position) => {
      const lesson = lessons.find((item) => item.id === id);
      return { lesson, position };
    });
    let chain: Promise<unknown> = Promise.resolve();
    for (const { lesson, position } of reordered) {
      if (!lesson) continue;
      chain = chain.then(() =>
        updateLesson.mutateAsync({
          id: lesson.id,
          input: {
            classId: activeClassId,
            titleEn: lesson.titleEn,
            titleMl: lesson.titleMl,
            bodyEn: lesson.bodyEn,
            bodyMl: lesson.bodyMl,
          },
        }),
      );
      void position;
    }
    chain
      .then(() => toast.success(t("admin.lessons.updated")))
      .catch(() => toast.error(t("admin.error.save")));
  };

  const confirmDelete = () => {
    if (!pendingDelete || !activeClassId) return;
    deleteLesson.mutate(
      { id: pendingDelete.id, classId: activeClassId },
      {
        onSuccess: () => toast.success(t("admin.lessons.deleted")),
        onError: () => toast.error(t("admin.error.save")),
      },
    );
    setPendingDelete(null);
  };

  const isSaving = createLesson.isPending || updateLesson.isPending;

  return (
    <div className="flex flex-col gap-6" data-ocid="admin.lessons.section">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {t("admin.lessons.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.lessons.subtitle")}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-class-select">
              {t("admin.lessons.selectClass")}
            </Label>
            <Select
              value={activeClassId ? String(activeClassId) : undefined}
              onValueChange={(value) => setSelectedClassId(BigInt(value))}
            >
              <SelectTrigger
                id="lesson-class-select"
                className="w-56"
                data-ocid="admin.lessons.class_select"
              >
                <SelectValue
                  placeholder={t("admin.lessons.selectPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {(classes ?? []).map((item) => (
                  <SelectItem key={String(item.id)} value={String(item.id)}>
                    {item.titleEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            disabled={!activeClassId}
            data-ocid="admin.lessons.new_button"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("admin.lessons.new")}
          </Button>
        </div>
      </div>

      {!activeClassId ? (
        <Card data-ocid="admin.lessons.empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ScrollText
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("admin.lessons.noClass")}
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div
          className="flex flex-col gap-4"
          data-ocid="admin.lessons.loading_state"
        >
          {Array.from({ length: 3 }, (_, i) => `lesson-skeleton-${i}`).map(
            (id) => (
              <Skeleton key={id} className="h-32 w-full rounded-xl" />
            ),
          )}
        </div>
      ) : isError ? (
        <Card data-ocid="admin.lessons.error_state">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t("admin.error.load")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void refetch()}
              data-ocid="admin.lessons.retry_button"
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      ) : !lessons || lessons.length === 0 ? (
        <Card data-ocid="admin.lessons.empty_state">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <ScrollText
              className="h-10 w-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="font-display text-lg font-semibold">
              {t("admin.lessons.empty")}
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("admin.lessons.emptyBody")}
            </p>
            <Button
              type="button"
              className="mt-2"
              onClick={openCreate}
              data-ocid="admin.lessons.empty_button"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t("admin.lessons.new")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4" data-ocid="admin.lessons.list">
          {lessons.map((lesson, index) => (
            <li key={String(lesson.id)}>
              <Card
                className="transition-smooth hover:border-primary/40"
                data-ocid={`admin.lessons.item.${index + 1}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate font-display text-base">
                        {lesson.titleEn}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {lesson.bodyEn || "—"}
                      </CardDescription>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      #{index + 1}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {lesson.poster ? (
                      <Badge variant="secondary" className="gap-1">
                        <ImageIcon className="h-3 w-3" aria-hidden="true" />
                        {t("admin.media.poster")}
                      </Badge>
                    ) : null}
                    {lesson.files.length > 0 ? (
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {lesson.files.length}
                      </Badge>
                    ) : null}
                    {lesson.video ? (
                      <Badge variant="secondary" className="gap-1">
                        <Video className="h-3 w-3" aria-hidden="true" />
                        {t("admin.media.video")}
                      </Badge>
                    ) : null}
                    {!lesson.poster &&
                    lesson.files.length === 0 &&
                    !lesson.video ? (
                      <span className="text-xs text-muted-foreground">
                        {t("admin.lessons.mediaEmpty")}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(lesson)}
                      data-ocid={`admin.lessons.edit_button.${index + 1}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      {t("admin.lessons.edit")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setPendingDelete(lesson)}
                      data-ocid={`admin.lessons.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {t("admin.lessons.delete")}
                    </Button>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={index === 0 || updateLesson.isPending}
                        aria-label={t("admin.lessons.moveUp")}
                        onClick={() => handleMove(index, -1)}
                        data-ocid={`admin.lessons.move_up_button.${index + 1}`}
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={
                          index === lessons.length - 1 || updateLesson.isPending
                        }
                        aria-label={t("admin.lessons.moveDown")}
                        onClick={() => handleMove(index, 1)}
                        data-ocid={`admin.lessons.move_down_button.${index + 1}`}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("admin.lessons.media")}
                    </p>
                    <MediaUploader
                      lessonId={lesson.id}
                      classId={activeClassId}
                    />
                    {lesson.poster ||
                    lesson.files.length > 0 ||
                    lesson.video ? (
                      <ul className="mt-3 flex flex-col gap-1">
                        {lesson.poster ? (
                          <li className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-muted-foreground">
                              {lesson.poster.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                removeMedia.mutate(
                                  {
                                    lessonId: lesson.id,
                                    mediaId: lesson.poster?.id ?? 0n,
                                    classId: activeClassId,
                                  },
                                  {
                                    onSuccess: () =>
                                      toast.success(
                                        t("admin.lessons.mediaRemoved"),
                                      ),
                                    onError: () =>
                                      toast.error(t("admin.error.save")),
                                  },
                                )
                              }
                              data-ocid={`admin.lessons.remove_poster_button.${index + 1}`}
                            >
                              {t("admin.lessons.removeMedia")}
                            </Button>
                          </li>
                        ) : null}
                        {lesson.files.map((file) => (
                          <li
                            key={String(file.id)}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="truncate text-muted-foreground">
                              {file.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                removeMedia.mutate(
                                  {
                                    lessonId: lesson.id,
                                    mediaId: file.id,
                                    classId: activeClassId,
                                  },
                                  {
                                    onSuccess: () =>
                                      toast.success(
                                        t("admin.lessons.mediaRemoved"),
                                      ),
                                    onError: () =>
                                      toast.error(t("admin.error.save")),
                                  },
                                )
                              }
                              data-ocid={`admin.lessons.remove_file_button.${index + 1}`}
                            >
                              {t("admin.lessons.removeMedia")}
                            </Button>
                          </li>
                        ))}
                        {lesson.video ? (
                          <li className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-muted-foreground">
                              {lesson.video.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive"
                              onClick={() =>
                                removeMedia.mutate(
                                  {
                                    lessonId: lesson.id,
                                    mediaId: lesson.video?.id ?? 0n,
                                    classId: activeClassId,
                                  },
                                  {
                                    onSuccess: () =>
                                      toast.success(
                                        t("admin.lessons.mediaRemoved"),
                                      ),
                                    onError: () =>
                                      toast.error(t("admin.error.save")),
                                  },
                                )
                              }
                              data-ocid={`admin.lessons.remove_video_button.${index + 1}`}
                            >
                              {t("admin.lessons.removeMedia")}
                            </Button>
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
          data-ocid="admin.lessons.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              {editing
                ? t("admin.lessons.editTitle")
                : t("admin.lessons.createTitle")}
            </DialogTitle>
            <DialogDescription>{t("admin.lessons.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-title-en">
                  {t("admin.lessons.titleEn")}
                </Label>
                <Input
                  id="lesson-title-en"
                  value={form.titleEn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleEn: e.target.value }))
                  }
                  required
                  data-ocid="admin.lessons.title_en_input"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="lesson-title-ml">
                  {t("admin.lessons.titleMl")}
                </Label>
                <Input
                  id="lesson-title-ml"
                  value={form.titleMl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, titleMl: e.target.value }))
                  }
                  required
                  data-ocid="admin.lessons.title_ml_input"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson-body-en">
                {t("admin.lessons.bodyEn")}
              </Label>
              <Textarea
                id="lesson-body-en"
                value={form.bodyEn}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bodyEn: e.target.value }))
                }
                rows={5}
                data-ocid="admin.lessons.body_en_input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lesson-body-ml">
                {t("admin.lessons.bodyMl")}
              </Label>
              <Textarea
                id="lesson-body-ml"
                value={form.bodyMl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bodyMl: e.target.value }))
                }
                rows={5}
                data-ocid="admin.lessons.body_ml_input"
              />
            </div>
            {formError ? (
              <p
                className="text-sm text-destructive"
                role="alert"
                data-ocid="admin.lessons.error_state"
              >
                {formError}
              </p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                data-ocid="admin.lessons.cancel_button"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                data-ocid="admin.lessons.save_button"
              >
                {isSaving ? t("admin.lessons.saving") : t("admin.lessons.save")}
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
        <AlertDialogContent data-ocid="admin.lessons.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.lessons.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.lessons.deleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.lessons.delete_cancel_button">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.lessons.delete_confirm_button"
            >
              {t("admin.lessons.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
