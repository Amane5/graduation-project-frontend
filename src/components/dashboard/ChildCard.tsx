import { Pencil, Trash2 } from "lucide-react";
import { Child, calcAge } from "@/lib/children";
import { cn } from "@/lib/utils";

interface Props {
  child: Child;
  onEdit: () => void;
  onDelete: () => void;
  onReports: () => void;

  delay?: number;

}


const ChildCard = ({ child, onEdit, onDelete, onReports, delay = 0 }: Props) => {
  const age = calcAge(child.birthdate);

  return (
    <div
      className="group rounded-3xl border border-border/50 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card animate-fade-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br text-4xl shadow-button transition-transform group-hover:scale-105",
            child.avatarColor,
          )}
        >
          {child.avatarEmoji}
        </div>
        <h3 className="text-lg font-bold text-foreground">
          {child.firstName} {child.lastName}
        </h3>
        <div className="mb-1 text-sm text-muted-foreground">
          {age !== null ? `${age} ${age === 1 ? "year" : "years"} old` : "N/A"}
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          @{child.username}
        </div>

        <div className="mt-5 grid w-full gap-2 sm:grid-cols-3">
          <button
            onClick={onEdit}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-input bg-card text-sm font-semibold text-foreground transition-all hover:scale-[1.02] hover:border-primary hover:text-primary"
            aria-label={`Edit ${child.firstName} ${child.lastName}`}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-destructive/20 bg-card text-sm font-semibold text-destructive transition-all hover:scale-[1.02] hover:border-destructive hover:bg-destructive/10"
            aria-label={`Delete ${child.firstName} ${child.lastName}`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onReports}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-primary/20 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          >
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
