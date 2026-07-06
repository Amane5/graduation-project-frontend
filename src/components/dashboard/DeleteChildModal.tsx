import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Child } from "@/lib/children";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // child: Child | null;
  title: string;
  description: string;
  onConfirm: () => void;
}

const DeleteChildModal = ({ open, onOpenChange, title, description, onConfirm }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm rounded-3xl border-border/50 shadow-card">
      <DialogHeader className="items-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-2">
          <Trash2 className="w-7 h-7 text-destructive" />
        </div>
        <DialogTitle className="text-xl">{title}</DialogTitle>
        <DialogDescription>
          {description}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex-row gap-2 sm:gap-2 mt-2">
        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={() => {
            onConfirm();
            onOpenChange(false);
          }}
        >
          Remove
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default DeleteChildModal;
