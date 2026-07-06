import { LucideIcon } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  emoji: string;
  gradient: string;
  delay?: number;
  helperText?: string;
}

const StatCard = ({
  label,
  value,
  suffix,
  icon: Icon,
  emoji,
  gradient,
  delay = 0,
  helperText,
}: StatCardProps) => {
  const numericValue = typeof value === "number" ? value : null;
  const animated = useCountUp(numericValue ?? 0, 1000);

  return (
    <div
      className="bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-card hover:-translate-y-1 transition-all duration-300 animate-fade-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-soft bg-gradient-to-br",
            gradient,
          )}
        >
          <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
        </div>
        <span className="text-2xl">{emoji}</span>
      </div>
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {numericValue === null ? value : animated}
        {numericValue !== null && suffix && (
          <span className="text-xl text-muted-foreground ml-1">{suffix}</span>
        )}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
      {helperText ? (
        <div className="text-xs text-muted-foreground mt-2">{helperText}</div>
      ) : null}
    </div>
  );
};

export default StatCard;
