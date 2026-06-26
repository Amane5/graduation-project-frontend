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
      className="group bg-card rounded-2xl p-6 shadow-soft border border-border/50 hover:shadow-card hover:-translate-y-1 transition-all duration-300 animate-fade-slide-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-button bg-gradient-to-br mb-4 transition-transform group-hover:scale-105",
            child.avatarColor,
          )}
        >
          {child.avatarEmoji}
        </div>
        <h3 className="font-bold text-lg text-foreground">
          {child.firstName} {child.lastName}
        </h3>
        <div className="text-sm text-muted-foreground mb-1">
          {age !== null ? `${age} ${age === 1 ? "year" : "years"} old` : "N/A"}
        </div>
        <div className="text-xs text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">
          @{child.username}
        </div>

        <div className="flex gap-2 mt-5 w-full">
          <button
            onClick={onEdit}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 border-input bg-card text-foreground text-sm font-semibold hover:border-primary hover:text-primary hover:scale-[1.02] transition-all"
            aria-label={`Edit ${child.firstName} {child.lastName}`}
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 border-destructive/20 bg-card text-destructive text-sm font-semibold hover:bg-destructive/10 hover:border-destructive hover:scale-[1.02] transition-all"
            aria-label={`Delete ${child.firstName} {child.lastName}`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <button
            onClick={onReports}
            className="
              flex-1 inline-flex
              items-center
              justify-center
              gap-1.5
              h-10
              rounded-xl
              border-2
              border-primary/20
              text-primary
              text-sm
              font-semibold
              hover:bg-primary/10
              transition-all
            "
          >
            Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChildCard;
