import { Plus, MessageCircle, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Conversation } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { BookOpen } from "lucide-react";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
}

const ChatSidebar = ({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
  open,
  onClose,
}: ChatSidebarProps) => {
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/30 backdrop-blur-sm z-30 animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 lg:z-auto",
          "w-72 h-screen bg-card border-r border-border/60 flex flex-col",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/50 space-y-3">

          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-button">
              <Sparkles
                className="w-5 h-5 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Sparky</h2>
              <p className="text-[11px] text-muted-foreground">
                Your learning buddy
              </p>
            </div>
          </div>
          <Button
            variant="hero"
            size="sm"
            className="w-full rounded-2xl marginBottom:10px"
            onClick={() => {
              onNew();
              onClose();
            }}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>

          <Button
            variant="hero"
            size="sm"
            className="w-full rounded-2xl"
            onClick={() => {
              navigate("/my-stories");
              onClose();
            }}
          >
            <BookOpen className="w-4 h-4" />
            My Stories
          </Button>

          <Button
            variant="hero"
            size="sm"
            className="w-full rounded-2xl"
            onClick={() => {
              navigate("/my-challenges");
              onClose();
            }}
          >
            <BookOpen className="w-4 h-4" />
            My Challenges
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground p-6">
              No chats yet. Start your first one! 🌟
            </div>
          ) : (
            conversations.map((c) => {
              const active = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  className={cn(
                    "group w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 transition-all",
                    active
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted border border-transparent",
                  )}
                >
                  <MessageCircle
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        active ? "text-primary" : "text-foreground",
                      )}
                    >
                      {c.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.lastActivity &&
                      !isNaN(new Date(c.lastActivity).getTime())
                        ? format(new Date(c.lastActivity), "PPP · p")
                        : "No activity"}
                    </p>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded-md hover:bg-destructive/10"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground">
            Made with 💜 for curious kids
          </p>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
