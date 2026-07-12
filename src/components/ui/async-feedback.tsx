import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AsyncFeedbackTone = "loading" | "success" | "error" | "info";

interface AsyncFeedbackProps {
  tone?: AsyncFeedbackTone;
  title?: string;
  message: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  className?: string;
}

const toneStyles: Record<
  AsyncFeedbackTone,
  {
    panel: string;
    iconWrap: string;
    icon: typeof Loader2;
  }
> = {
  loading: {
    panel: "border-primary/20 bg-primary/5 text-primary",
    iconWrap: "bg-primary/10 text-primary",
    icon: Loader2,
  },
  success: {
    panel: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
    iconWrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  error: {
    panel: "border-destructive/20 bg-destructive/5 text-destructive",
    iconWrap: "bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
  info: {
    panel: "border-border/60 bg-muted/30 text-foreground",
    iconWrap: "bg-background text-muted-foreground",
    icon: Info,
  },
};

export function AsyncFeedback({
  tone = "info",
  title,
  message,
  actionLabel,
  onAction,
  actionLoading,
  className,
}: AsyncFeedbackProps) {
  const { panel, iconWrap, icon: Icon } = toneStyles[tone];

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft sm:flex-row sm:items-start sm:justify-between",
        panel,
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", iconWrap)}>
          <Icon className={cn("h-4 w-4", tone === "loading" && "animate-spin")} />
        </div>
        <div className="min-w-0">
          {title ? <p className="font-semibold text-foreground">{title}</p> : null}
          <div className={cn("leading-6", title ? "mt-1 text-muted-foreground" : "")}>{message}</div>
        </div>
      </div>

      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onAction}
          loading={actionLoading}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
