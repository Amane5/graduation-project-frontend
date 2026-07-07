import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bot, Menu, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import PlayfulBackground from "@/components/PlayfulBackground";
import ChatInput from "@/components/chat/ChatInput";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatTopControls from "@/components/chat/ChatTopControls";
import JourneyMessage from "@/components/chat/JourneyMessage";
import MessageBubble, { type ChatAttachment } from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationHandler } from "@/hooks/useFirebaseNotifications";
import {
  createConversation,
  deleteConversation as dbDeleteConversation,
  listConversations,
  listMessages,
  streamChat,
  type AskMessage,
  type Conversation,
} from "@/lib/chat";
import {
  generateStoryFromDrawing,
  getDrawingStorySession,
  sendDrawingStoryMessage,
  startDrawingStory,
} from "@/lib/drawingStory";
import { getTokenStats } from "@/lib/profile";

const IMAGE_FILE_EXTENSIONS = new Set([
  "apng",
  "avif",
  "bmp",
  "gif",
  "heic",
  "heif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp",
]);

const AUDIO_FILE_EXTENSIONS = new Set([
  "aac",
  "flac",
  "m4a",
  "mp3",
  "ogg",
  "wav",
  "webm",
]);

type PersistedAttachmentRecord = Partial<ChatAttachment> & {
  kind?: string;
};

const getFileExtension = (fileName: string) =>
  fileName.split(".").pop()?.trim().toLowerCase() ?? "";

const getAttachmentKind = (file: File): ChatAttachment["kind"] => {
  const mimeType = file.type.toLowerCase();

  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("audio/")) {
    return "audio";
  }

  const extension = getFileExtension(file.name);

  if (IMAGE_FILE_EXTENSIONS.has(extension)) {
    return "image";
  }

  if (AUDIO_FILE_EXTENSIONS.has(extension)) {
    return "audio";
  }

  return "file";
};

type UiMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  audioUrl?: string;
  imageUrl?: string;
  attachments?: ChatAttachment[];
  responseMode?: string;
  journeyData?: unknown;
};

const Chat = () => {
  const { t } = useTranslation();
  const suggestedMessages = [
    { emoji: "🌍", text: t("suggestSky") },
    { emoji: "🦖", text: t("suggestDino") },
    { emoji: "🚀", text: t("suggestRocket") },
    { emoji: "🐙", text: t("suggestOctopus") },
  ];

  const { id: routeConvoId } = useParams<{ id?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [mode, setMode] = useState<"normal" | "journey" | "drawing">("normal");
  const [drawingConversationId, setDrawingConversationId] = useState<number | null>(null);
  const [drawingStarted, setDrawingStarted] = useState(false);
  const [drawingLoading, setDrawingLoading] = useState(false);
  const [drawingFinished, setDrawingFinished] = useState(false);
  const [drawingStatus, setDrawingStatus] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const { user } = useAuth();
  const navigate = useNavigate();

  const resetDrawingState = useCallback(
    (nextMode: "normal" | "journey" | "drawing" = "normal") => {
      setMode(nextMode);
      setDrawingConversationId(null);
      setDrawingStarted(false);
      setDrawingFinished(false);
      setDrawingStatus("");
    },
    [],
  );

  const createAttachmentsFromFiles = useCallback(
    (files: File[]): ChatAttachment[] =>
      files.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        const kind = getAttachmentKind(file);

        if (kind === "image") {
          return {
            kind: "image",
            name: file.name || t("chatAttachmentImage"),
            url: previewUrl,
            mimeType: file.type,
          };
        }

        if (kind === "audio") {
          return {
            kind: "audio",
            name: file.name || t("chatAttachmentAudio"),
            url: previewUrl,
            mimeType: file.type,
          };
        }

        return {
          kind: "file",
          name: file.name || t("chatAttachmentFile"),
          url: previewUrl,
          mimeType: file.type,
        };
      }),
    [t],
  );

  const createPersistedAttachments = useCallback(
    (message: AskMessage): ChatAttachment[] => {
      const persistedAttachments = (() => {
        if (!message.journeyData || typeof message.journeyData !== "object") {
          return [];
        }

        const candidate = (message.journeyData as { attachments?: unknown }).attachments;

        if (!Array.isArray(candidate)) {
          return [];
        }

        return candidate.flatMap((attachment) => {
          if (!attachment || typeof attachment !== "object") {
            return [];
          }

          const record = attachment as PersistedAttachmentRecord;

          if (
            record.kind !== "image" &&
            record.kind !== "audio" &&
            record.kind !== "file"
          ) {
            return [];
          }

          const defaultName =
            record.kind === "image"
              ? t("chatAttachmentImage")
              : record.kind === "audio"
                ? t("chatAttachmentAudio")
                : t("chatAttachmentFile");

          return [
            {
              kind: record.kind,
              name:
                typeof record.name === "string" && record.name.trim().length > 0
                  ? record.name
                  : defaultName,
              url: typeof record.url === "string" ? record.url : undefined,
              mimeType:
                typeof record.mimeType === "string" ? record.mimeType : undefined,
              description:
                typeof record.description === "string"
                  ? record.description
                  : undefined,
            } satisfies ChatAttachment,
          ];
        });
      })();

      if (persistedAttachments.length > 0) {
        return persistedAttachments;
      }

      const attachments: ChatAttachment[] = [];

      if (message.imageDescription) {
        attachments.push({
          kind: "image",
          name: t("chatAttachmentImage"),
          description: message.imageDescription,
        });
      }

      if (message.voiceText) {
        attachments.push({
          kind: "audio",
          name: t("chatAttachmentAudio"),
          description: message.voiceText,
        });
      }

      return attachments;
    },
    [t],
  );

  useNotificationHandler({
    type: "AI_PROGRESS",
    handler: (payload) => {
      setDrawingStatus(payload.data?.step || "");
    },
  });

  useEffect(() => {
    void getTokenStats().then((response) => {
      setTokenBalance(response.data.tokenBalance);
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const list = await listConversations(user.id);
        setConversations(list);
      } catch {
        toast.error(t("couldntLoadChats"));
      } finally {
        setLoadingConvos(false);
      }
    })();
  }, [t, user]);

  useEffect(() => {
    if (routeConvoId) {
      setActiveId(Number(routeConvoId));
    } else if (conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [routeConvoId, conversations]);

  useEffect(() => {
    if (!activeId || streaming) return;

    setLoadingMsgs(true);

    (async () => {
      try {
        const [loadedMessages, drawingSession] = await Promise.all([
          listMessages(activeId),
          getDrawingStorySession(activeId),
        ]);

        setMessages(
          loadedMessages.flatMap((message) => [
            {
              id: `q_${message.id}`,
              role: "user",
              content: message.question,
              attachments: createPersistedAttachments(message),
            },
            {
              id: `a_${message.id}`,
              role: "assistant",
              content: message.answer,
              audioUrl: message.audioUrl,
              imageUrl: message.imageUrl,
              responseMode: message.responseMode,
              journeyData: message.journeyData,
            },
          ]),
        );

        if (drawingSession) {
          setMode("drawing");
          setDrawingConversationId(drawingSession.conversationId);
          setDrawingStarted(true);
          setDrawingFinished(drawingSession.interviewFinished);
          setDrawingStatus("");
        } else {
          resetDrawingState();
        }
      } catch {
        toast.error(t("couldntLoadMessages"));
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [activeId, createPersistedAttachments, resetDrawingState, streaming, t]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
    resetDrawingState();
  }, [resetDrawingState]);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await dbDeleteConversation(id);
        setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([]);
          resetDrawingState();
        }
        toast.success(t("chatRemoved"));
      } catch {
        toast.error(t("couldntDeleteChat"));
      }
    },
    [activeId, resetDrawingState, t],
  );

  const handleSend = async (text: string, files: File[] = []) => {
    if (mode === "drawing" && drawingStarted) {
      const userMessage: UiMessage = {
        id: Date.now(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        setStreaming(true);
        const response = await sendDrawingStoryMessage({
          conversationId: drawingConversationId,
          message: text,
        });
        setStreaming(false);

        if (response.data.finished) {
          setDrawingFinished(true);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              role: "assistant",
              content: response.data.reply,
            },
          ]);
        }
      } catch (error) {
        console.error(error);
        toast.error(t("chatSendFailed"));
      } finally {
        setStreaming(false);
      }
      return;
    }

    if (!user) return;

    let conversationId = activeId;

    if (!conversationId) {
      try {
        const titleSeed = text.trim() || files[0]?.name || t("chatNewConversation");
        const conversation = await createConversation(titleSeed.slice(0, 40));
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversation.id);
        conversationId = conversation.id;
      } catch {
        toast.error(t("couldntStartChat"));
        return;
      }
    }

    const optimisticUser: UiMessage = {
      id: `tmp_${Date.now()}`,
      role: "user",
      content: text,
      attachments: createAttachmentsFromFiles(files),
    };

    setMessages((prev) => [...prev, optimisticUser]);

    const assistantTmpId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantTmpId, role: "assistant", content: "", streaming: true },
    ]);

    setStreaming(true);
    abortRef.current = { aborted: false };

    let accumulated = "";

    await streamChat({
      question: text,
      conversationId,
      files,
      mode: mode === "drawing" ? "normal" : mode,
      onDelta: (chunk) => {
        if (abortRef.current.aborted) return;
        accumulated += chunk;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantTmpId ? { ...message, content: accumulated } : message,
          ),
        );
      },
      onDone: () => {
        setStreaming(false);
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantTmpId ? { ...message, streaming: false } : message,
          ),
        );
      },
      onError: (message) => {
        setStreaming(false);
        setMessages((prev) => prev.filter((item) => item.id !== assistantTmpId));
        toast.error(message);
      },
      onAudio: (audioUrl) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantTmpId ? { ...message, audioUrl } : message,
          ),
        );
      },
      onImage: (imageUrl) => {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantTmpId ? { ...message, imageUrl } : message,
          ),
        );
      },
    });
  };

  const handleStop = () => {
    abortRef.current.aborted = true;
    setStreaming(false);
    setMessages((prev) =>
      prev.map((message) => (message.streaming ? { ...message, streaming: false } : message)),
    );
  };

  const handleStartDrawing = async (file: File) => {
    try {
      setDrawingLoading(true);

      const response = await startDrawingStory(file);
      setDrawingConversationId(response.data.conversationId);
      setActiveId(response.data.conversationId);
      setMode("drawing");
      setDrawingStarted(true);
      setDrawingFinished(false);
      setDrawingStatus("");
      setConversations((prev) => [
        {
          id: response.data.conversationId,
          title: t("chatDrawingStoryTitle"),
          lastActivity: new Date().toISOString(),
        },
        ...prev.filter(
          (conversation) => conversation.id !== response.data.conversationId,
        ),
      ]);

      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: response.data.reply,
        },
      ]);
    } catch (error) {
      console.error(error);
      toast.error(t("chatAnalyzeDrawingFailed"));
    } finally {
      setDrawingLoading(false);
    }
  };

  const handleGenerateStory = async () => {
    if (!drawingConversationId) return;

    try {
      setDrawingStatus(t("generating"));
      setDrawingLoading(true);
      await generateStoryFromDrawing({
        conversationId: drawingConversationId,
      });
      toast.success(t("chatStoryCreated"));
      navigate("/my-stories");
    } catch {
      toast.error(t("chatGenerateStoryFailed"));
    } finally {
      setDrawingLoading(false);
      setDrawingStatus("");
    }
  };

  const showEmpty = !loadingMsgs && messages.length === 0;

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 playful-bg opacity-40" aria-hidden />
      <PlayfulBackground />

      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNew={handleNew}
        onDelete={handleDelete}
        loading={loadingConvos}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border/50 bg-card/80 px-3 py-2.5 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-muted"
            aria-label={t("openChats")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-button">
              <Sparkles className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <span className="block truncate font-bold">{t("sparkyName")}</span>
              <span className="block text-[11px] text-muted-foreground">
                {t("chatCompanionLabel")}
              </span>
            </div>
          </div>
          <ChatTopControls />
        </header>

        <div className="absolute right-4 top-4 z-30 hidden lg:flex">
          <ChatTopControls />
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {loadingMsgs ? (
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 animate-pulse rounded-full bg-muted" />
                      <div className="h-20 max-w-md animate-pulse rounded-3xl bg-card shadow-soft" />
                    </div>
                  </div>
                ))}
              </div>
            ) : showEmpty ? (
              <div className="animate-fade-slide-up py-6">
                <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 text-center shadow-card backdrop-blur-sm sm:p-8">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-primary shadow-card">
                    <Bot className="h-10 w-10 text-primary-foreground" strokeWidth={2.2} />
                  </div>
                  <h1 className="text-3xl font-bold">{t("chatWelcome")}</h1>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                    {t("chatDescription")}
                  </p>

                  <div className="mt-6 grid gap-3 rounded-3xl bg-muted/30 p-4 text-left sm:grid-cols-2">
                    <div className="rounded-2xl bg-card px-4 py-3 shadow-soft">
                      <div className="text-sm font-semibold text-foreground">{t("chatEmptyCardOneTitle")}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("chatEmptyCardOneDescription")}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-card px-4 py-3 shadow-soft">
                      <div className="text-sm font-semibold text-foreground">{t("chatEmptyCardTwoTitle")}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {t("chatEmptyCardTwoDescription")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid w-full gap-3 sm:grid-cols-2">
                    {suggestedMessages.map((suggestion) => (
                      <button
                        key={suggestion.text}
                        type="button"
                        onClick={() => handleSend(suggestion.text)}
                        disabled={streaming}
                        className="rounded-2xl border-2 border-border/60 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="mb-1 text-2xl">{suggestion.emoji}</div>
                        <div className="text-sm font-semibold">{suggestion.text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  if (message.role === "assistant" && message.responseMode === "journey") {
                    return (
                      <JourneyMessage
                        key={message.id}
                        content={message.content}
                        audioUrl={message.audioUrl}
                        imageUrl={message.imageUrl}
                      />
                    );
                  }

                  return (
                    <MessageBubble
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      imageUrl={message.imageUrl}
                      audioUrl={message.audioUrl}
                      attachments={message.attachments}
                      isStreaming={message.streaming}
                    />
                  );
                })}
                {streaming && messages[messages.length - 1]?.content === "" ? <TypingIndicator /> : null}
              </>
            )}
          </div>
        </div>

        {drawingFinished ? (
          <div className="mx-auto mb-2 w-full max-w-3xl px-3 sm:px-6">
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-4 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Wand2 className="h-4 w-4" />
                    {t("chatDrawingReadyTitle")}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("chatDrawingReadyDescription")}
                  </p>
                </div>
                <Button onClick={handleGenerateStory} disabled={drawingLoading}>
                  {drawingLoading ? drawingStatus || t("generating") : t("chatBringDrawingToLife")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <ChatInput
          onSend={handleSend}
          disabled={streaming || drawingLoading}
          isStreaming={streaming}
          onStop={handleStop}
          tokenBalance={tokenBalance}
          mode={mode}
          onModeChange={setMode}
          onStartDrawing={handleStartDrawing}
          drawingStarted={drawingStarted}
        />
      </div>
    </div>
  );
};

export default Chat;
