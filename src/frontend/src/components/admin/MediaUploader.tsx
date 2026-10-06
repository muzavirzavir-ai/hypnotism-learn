import { MediaKind } from "@/backend";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { useAttachLessonMedia } from "@/hooks/useQueries";
import type { ClassId, LessonId } from "@/types";
import { FileText, Image as ImageIcon, Upload, Video } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface MediaUploaderProps {
  lessonId: LessonId;
  classId: ClassId;
}

interface KindConfig {
  kind: MediaKind;
  labelKey: "admin.media.poster" | "admin.media.file" | "admin.media.video";
  accept: string;
  icon: typeof ImageIcon;
}

const KINDS: KindConfig[] = [
  {
    kind: MediaKind.poster,
    labelKey: "admin.media.poster",
    accept: "image/*",
    icon: ImageIcon,
  },
  {
    kind: MediaKind.file,
    labelKey: "admin.media.file",
    accept: ".pdf,.doc,.docx,.txt,application/pdf",
    icon: FileText,
  },
  {
    kind: MediaKind.video,
    labelKey: "admin.media.video",
    accept: "video/*",
    icon: Video,
  },
];

/**
 * File-picker uploads for a lesson. Media is sent to the backend as bytes;
 * no public URL or download affordance is ever rendered.
 */
export function MediaUploader({ lessonId, classId }: MediaUploaderProps) {
  const { t } = useLanguage();
  const attach = useAttachLessonMedia();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [busyKind, setBusyKind] = useState<MediaKind | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFile = (config: KindConfig, file: File) => {
    const key = config.kind;
    setBusyKind(config.kind);
    setProgress((p) => ({ ...p, [key]: 5 }));

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 60);
        setProgress((p) => ({ ...p, [key]: Math.max(5, percent) }));
      }
    };
    reader.onerror = () => {
      setBusyKind(null);
      setProgress((p) => ({ ...p, [key]: 0 }));
      toast.error(t("admin.media.error"));
    };
    reader.onload = () => {
      const result = reader.result;
      if (!(result instanceof ArrayBuffer)) {
        setBusyKind(null);
        setProgress((p) => ({ ...p, [key]: 0 }));
        toast.error(t("admin.media.error"));
        return;
      }
      setProgress((p) => ({ ...p, [key]: 70 }));
      attach.mutate(
        {
          lessonId,
          classId,
          kind: config.kind,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          blob: new Uint8Array(result),
        },
        {
          onSuccess: () => {
            setProgress((p) => ({ ...p, [key]: 100 }));
            toast.success(t("admin.media.uploadedToast"));
            window.setTimeout(() => {
              setProgress((p) => ({ ...p, [key]: 0 }));
            }, 1200);
          },
          onError: () => {
            setProgress((p) => ({ ...p, [key]: 0 }));
            toast.error(t("admin.media.error"));
          },
          onSettled: () => setBusyKind(null),
        },
      );
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col gap-3" data-ocid="admin.media.uploader">
      <p className="text-xs text-muted-foreground">
        {t("admin.media.privateNote")}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {KINDS.map((config) => {
          const Icon = config.icon;
          const value = progress[config.kind] ?? 0;
          const isBusy = busyKind === config.kind;
          return (
            <div
              key={config.kind}
              className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Label className="text-xs font-medium">
                  {t(config.labelKey)}
                </Label>
              </div>
              <input
                ref={(el) => {
                  inputRefs.current[config.kind] = el;
                }}
                type="file"
                accept={config.accept}
                className="sr-only"
                id={`media-${config.kind}`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFile(config, file);
                  event.target.value = "";
                }}
                data-ocid={`admin.media.${config.kind}_input`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => inputRefs.current[config.kind]?.click()}
                data-ocid={`admin.media.${config.kind}_button`}
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                {isBusy
                  ? t("admin.media.uploading", { percent: value })
                  : t("admin.media.choose")}
              </Button>
              {value > 0 ? (
                <div className="flex flex-col gap-1">
                  <Progress
                    value={value}
                    aria-label={t("admin.media.uploading", { percent: value })}
                    data-ocid={`admin.media.${config.kind}_progress`}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {value >= 100
                      ? t("admin.media.uploaded")
                      : t("admin.media.uploading", { percent: value })}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
