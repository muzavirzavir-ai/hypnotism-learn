import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import type { AccessKind } from "@/types";
import { AlertCircle, ArrowRight, Loader2, ShieldAlert } from "lucide-react";
import { type FormEvent, useId, useState } from "react";

interface AccessKeyFormProps {
  /** Which backend key kind this form verifies. */
  kind: AccessKind;
  /** Translation keys for the label, placeholder, and submit button. */
  labelKey: "access.keyLabel" | "adminAccess.keyLabel";
  placeholderKey: "access.keyPlaceholder" | "adminAccess.keyPlaceholder";
  submitKey: "access.submit" | "adminAccess.submit";
  /** Called after a successful verification, before navigation. */
  onSuccess: (identifier: string) => void;
  /** When true, also collect the student's identifier for dashboard lookup. */
  collectIdentifier?: boolean;
  className?: string;
}

type FormError =
  | { type: "invalidKey" }
  | { type: "rateLimited"; seconds: number }
  | { type: "generic" }
  | null;

/**
 * Access-key entry form shared by the student landing page and the
 * admin access page. Verifies the key through the session context and
 * surfaces invalid-key, rate-limit, and generic errors.
 */
export function AccessKeyForm({
  kind,
  labelKey,
  placeholderKey,
  submitKey,
  onSuccess,
  collectIdentifier = false,
  className,
}: AccessKeyFormProps) {
  const { t } = useLanguage();
  const { signIn, isSigningIn } = useSession();
  const inputId = useId();
  const identifierId = useId();
  const errorId = useId();
  const [key, setKey] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<FormError>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError({ type: "generic" });
      return;
    }

    setError(null);
    const enteredIdentifier = identifier.trim();
    const outcome = await signIn(kind, trimmed, enteredIdentifier || undefined);

    if (outcome.status === "ok") {
      setKey("");
      setIdentifier("");
      onSuccess(enteredIdentifier);
      return;
    }
    if (outcome.status === "invalidKey") {
      setError({ type: "invalidKey" });
      return;
    }
    if (outcome.status === "rateLimited") {
      setError({ type: "rateLimited", seconds: outcome.retryAfterSeconds });
      return;
    }
    setError({ type: "generic" });
  };

  const errorMessage =
    error?.type === "invalidKey"
      ? t("error.invalidKey")
      : error?.type === "rateLimited"
        ? t("error.rateLimited", { seconds: error.seconds })
        : error?.type === "generic"
          ? t("error.generic")
          : null;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={cn("space-y-4", className)}
      noValidate
      data-ocid={`${kind}.access_form`}
    >
      {collectIdentifier ? (
        <div className="space-y-2">
          <Label htmlFor={identifierId} className="text-sm font-medium">
            {t("access.identifierLabel")}
          </Label>
          <Input
            id={identifierId}
            name="studentIdentifier"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder={t("access.identifierPlaceholder")}
            disabled={isSigningIn}
            className="h-11 rounded-xl bg-background/60 text-sm"
            data-ocid={`${kind}.identifier_input`}
          />
          <p className="text-xs text-muted-foreground">
            {t("access.identifierHint")}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-sm font-medium">
          {t(labelKey)}
        </Label>
        <Input
          id={inputId}
          name="accessKey"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={key}
          onChange={(event) => {
            setKey(event.target.value);
            if (error) setError(null);
          }}
          placeholder={t(placeholderKey)}
          aria-invalid={error !== null}
          aria-describedby={errorMessage ? errorId : undefined}
          disabled={isSigningIn}
          className="h-11 rounded-xl bg-background/60 font-mono text-sm tracking-wide"
          data-ocid={`${kind}.access_input`}
        />
      </div>

      {errorMessage ? (
        <div
          id={errorId}
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          data-ocid={`${kind}.access_error`}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={isSigningIn || key.trim().length === 0}
        className="h-11 w-full rounded-xl bg-gradient-primary font-semibold text-white shadow-elevated transition-smooth hover:-translate-y-0.5 hover:shadow-floating"
        data-ocid={`${kind}.access_submit_button`}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t(
              kind === "admin" ? "adminAccess.submitting" : "access.submitting",
            )}
          </>
        ) : (
          <>
            {t(submitKey)}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </Button>

      {kind === "admin" ? (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          {t("adminAccess.subtitle")}
        </p>
      ) : (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          {t("access.help")}
        </p>
      )}
    </form>
  );
}
