import { BookOpen, MessageCircle, Plus, Sparkles, Trash2, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { Conversation } from "@/lib/chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userType } = useAuth();

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30 animate-fade-in bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-border/60 bg-card transition-transform duration-300 ease-out lg:sticky lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="space-y-3 border-b border-border/50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-button">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("sparkyName")}</h2>
              <p className="text-[11px] text-muted-foreground">{t("chatSidebarTagline")}</p>
            </div>
          </div>

          <Button
            variant="hero"
            size="sm"
            className="w-full rounded-2xl"
            onClick={() => {
              onNew();
              onClose();
            }}
          >
            <Plus className="h-4 w-4" />
            {t("chatNewConversation")}
          </Button>

          {userType === "child" ? (
            <>
              <Button
                variant="hero"
                size="sm"
                className="w-full rounded-2xl"
                onClick={() => {
                  navigate("/my-stories");
                  onClose();
                }}
              >
                <BookOpen className="h-4 w-4" />
                {t("navMyStories")}
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
                <Trophy className="h-4 w-4" />
                {t("navMyChallenges")}
              </Button>
            </>
          ) : null}
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {t("chatNoConversations")}
            </div>
          ) : (
            conversations.map((conversation) => {
              const active = conversation.id === activeId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => {
                    onSelect(conversation.id);
                    onClose();
                  }}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                    active
                      ? "border-primary/20 bg-primary/10"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <MessageCircle
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        active ? "text-primary" : "text-foreground",
                      )}
                    >
                      {conversation.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {conversation.lastActivity &&
                      !isNaN(new Date(conversation.lastActivity).getTime())
                        ? format(new Date(conversation.lastActivity), "PPP · p")
                        : t("chatNoActivity")}
                    </p>
                  </div>
                  <div
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(conversation.id);
                    }}
                    className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">{t("chatSidebarFooter")}</p>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
