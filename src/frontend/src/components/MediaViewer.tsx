import { createActor } from "@/backend";
import { WatermarkOverlay } from "@/components/WatermarkOverlay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import type { Lesson, MediaRef } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { FileText, ImageOff, Play, ShieldAlert } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

interface MediaViewerProps {
  lessonId: bigint;
  studentId: bigint;
  watermarkEnabled: boolean;
  identifier: string;
}

/** Build a temporary object URL for an authorized media blob. */
function useObjectUrl(blob: Uint8Array | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob || blob.byteLength === 0) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(
      new Blob([blob as BlobPart], { type: "application/octet-stream" }),
    );
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
}

function MediaFrame({
  children,
  watermark,
  identifier,
}: {
  children: ReactNode;
  watermark: boolean;
  identifier: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background">
      {children}
      {watermark ? <WatermarkOverlay identifier={identifier} /> : null}
    </div>
  );
}

/**
 * Renders a lesson's poster, video, and files exclusively through the
 * server-authorized `getAuthorizedLessonMedia` call. No public URLs and no
 * download controls are ever exposed for protected content.
 */
export function MediaViewer({
  lessonId,
  studentId,
  watermarkEnabled,
  identifier,
}: MediaViewerProps) {
  const { t } = useLanguage();
  const { session } = useSession();
  const { actor, isFetching } = useActor(createActor);
  const token = session?.token;

  const query = useQuery({
    queryKey: ["lessonMedia", token, studentId.toString(), lessonId.toString()],
    queryFn: async (): Promise<Lesson | null> => {
      if (!actor || !token) return null;
      return actor.getAuthorizedLessonMedia(token, studentId, lessonId);
    },
    enabled: !!actor && !isFetching && !!token,
  });

  const lesson = query.data ?? null;
  const poster = lesson?.poster;
  const video = lesson?.video;
  const files = useMemo(() => lesson?.files ?? [], [lesson]);

  const posterUrl = useObjectUrl(poster?.blob);
  const videoUrl = useObjectUrl(video?.blob);

  if (query.isLoading) {
    return (
      <div className="space-y-4" data-ocid="media.loading_state">
        <Skeleton className="aspect-video w-full rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-6 py-10 text-center"
        data-ocid="media.error_state"
      >
        <ShieldAlert className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{t("error.generic")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void query.refetch()}
          data-ocid="media.retry_button"
        >
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 px-6 py-10 text-center"
        data-ocid="media.not_authorized_state"
      >
        <ShieldAlert className="h-8 w-8 text-warning" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {t("media.notAuthorized")}
        </p>
      </div>
    );
  }

  const hasMedia = !!poster || !!video || files.length > 0;

  if (!hasMedia) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 px-6 py-10 text-center"
        data-ocid="media.empty_state"
      >
        <ImageOff
          className="h-8 w-8 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">{t("media.empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="media.viewer">
      {video && videoUrl ? (
        <MediaFrame watermark={watermarkEnabled} identifier={identifier}>
          {/* biome-ignore lint/a11y/useMediaCaption: protected lesson media has no caption track */}
          <video
            className="aspect-video w-full bg-background"
            controls
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            onContextMenu={(event) => event.preventDefault()}
            poster={posterUrl ?? undefined}
            preload="metadata"
            data-ocid="media.video"
          >
            <source src={videoUrl} type={video.mimeType} />
            {t("media.videoUnsupported")}
          </video>
        </MediaFrame>
      ) : poster && posterUrl ? (
        <MediaFrame watermark={watermarkEnabled} identifier={identifier}>
          <img
            src={posterUrl}
            alt={t("media.posterAlt")}
            className="aspect-video w-full object-cover"
            data-ocid="media.poster"
          />
        </MediaFrame>
      ) : null}

      {files.length > 0 ? (
        <ul className="space-y-2" data-ocid="media.file_list">
          {files.map((file: MediaRef, index: number) => (
            <li
              key={file.id.toString()}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
              data-ocid={`media.file.${index + 1}`}
            >
              <FileText
                className="h-5 w-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {file.name}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {t("media.protected")}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {video && !videoUrl ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Play className="h-4 w-4" aria-hidden="true" />
          {t("common.loading")}
        </p>
      ) : null}
    </div>
  );
}
