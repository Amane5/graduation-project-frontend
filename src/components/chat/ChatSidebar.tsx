import { format } from "date-fns";
import { MessageCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { Conversation } from "@/lib/chat";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onNew: () => void;
  onDelete: (id: number) => void;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
  offsetTop?: number;
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
  offsetTop = 0,
}: ChatSidebarProps) => {
  const { t } = useTranslation();

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        style={{
          top: `${offsetTop}px`,
          height: `calc(100dvh - ${offsetTop}px)`,
        }}
        className={cn(
          "fixed left-0 z-40 flex w-72 flex-col overflow-hidden border-r border-border/60 bg-card/95 backdrop-blur-md transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="shrink-0 space-y-3 border-b border-border/50 p-4">
          {/* <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-button">
              <Sparkles className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">{t("sparkyName")}</h2>
              <p className="text-[11px] text-muted-foreground">{t("chatSidebarTagline")}</p>
            </div>
          </div> */}

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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" strokeWidth={2.2} />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">
                {t("chatNoConversations")}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("chatSidebarEmptyHint")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={() => {
                  onNew();
                  onClose();
                }}
              >
                <Plus className="h-4 w-4" />
                {t("chatNewConversation")}
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => {
                const active = conversation.id === activeId;
                const hasValidDate =
                  conversation.lastActivity &&
                  !Number.isNaN(new Date(conversation.lastActivity).getTime());

                return (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-start gap-2 rounded-2xl border px-2 py-2 transition-all",
                      active
                        ? "border-primary/20 bg-primary/10 shadow-soft"
                        : "border-transparent hover:bg-muted",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(conversation.id);
                        onClose();
                      }}
                      className="flex min-w-0 flex-1 items-start gap-2.5 rounded-xl px-1 py-0.5 text-left"
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
                          {hasValidDate
                            ? format(new Date(conversation.lastActivity), "PPP p")
                            : t("chatNoActivity")}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(conversation.id);
                      }}
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/50 p-3 text-center">
          <p className="text-[10px] text-muted-foreground">{t("chatSidebarFooter")}</p>
        </div>
      </aside>
    </>
  );
};

export default ChatSidebar;
