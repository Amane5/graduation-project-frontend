import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  tone?: "default" | "warning" | "success";
}

const toneClasses = {
  default: {
    panel: "border-border/60 bg-card/80",
    iconWrap: "bg-primary/10 text-primary",
  },
  warning: {
    panel: "border-destructive/20 bg-destructive/5",
    iconWrap: "bg-destructive/10 text-destructive",
  },
  success: {
    panel: "border-success/20 bg-success/5",
    iconWrap: "bg-success/10 text-success",
  },
} as const;

export const PageState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  tone = "default",
}: PageStateProps) => {
  const styles = toneClasses[tone];

  return (
    <div
      className={cn(
        "rounded-3xl border p-8 text-center shadow-soft",
        styles.panel,
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
          styles.iconWrap,
        )}
      >
        <Icon className="h-7 w-7" strokeWidth={2.2} />
      </div>
      <h2 className="mt-4 text-xl font-bold text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

