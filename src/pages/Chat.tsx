import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, Sparkles, Bot } from "lucide-react";
import { toast } from "sonner";
import PlayfulBackground from "@/components/PlayfulBackground";
import ChatSidebar from "@/components/chat/ChatSidebar";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import ChatInput from "@/components/chat/ChatInput";
import ChatTopControls from "@/components/chat/ChatTopControls";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import {
  Conversation,
  AskMessage,
  createConversation,
  deleteConversation as dbDeleteConversation,
  listConversations,
  listMessages,
  streamChat,
} from "@/lib/chat";
import { getTokenStats } from "@/lib/profile";
import JourneyMessage from "@/components/chat/JourneyMessage";
import { generateStoryFromDrawing, sendDrawingStoryMessage, startDrawingStory } from "@/lib/drawingStory";
import { useNotificationHandler } from "@/hooks/useFirebaseNotifications";

type UiMessage = {
  id: number | string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  audioUrl?: string;
  imageUrl?: string;

  responseMode?: string;
  journeyData?: any;
};


const Chat = () => {
  const { t } = useTranslation();
  const SUGGESTED = [
  { emoji: "🌍", text: t("suggestedQuestion1") },
  { emoji: "🦖", text: t("suggestedQuestion2") },
  { emoji: "🚀", text: t("suggestedQuestion3") },
  { emoji: "🐙", text: t("suggestedQuestion4") },
];

  const { id: routeConvoId } = useParams<{ id?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const { user } = useAuth();
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const [mode, setMode] = useState<"normal" | "journey" | "drawing">("normal");

  const [drawingConversationId, setDrawingConversationId] = useState<number | null>(null);

  const [drawingStarted, setDrawingStarted] = useState(false);

  const [drawingLoading, setDrawingLoading] = useState(false);

  const [drawingFinished, setDrawingFinished] = useState(false);

  const [drawingStatus, setDrawingStatus] = useState("");
  const navigate = useNavigate()
  
  useNotificationHandler({
    type: "AI_PROGRESS",
    handler: (payload) => {
      setDrawingStatus(payload.data?.step || "");
    },
  });
    
  useEffect(() => {
    getTokenStats().then((res) => {
      setTokenBalance(res.data.tokenBalance);
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
  }, [user]);

  useEffect(() => {
    if (routeConvoId) {
      setActiveId(Number(routeConvoId));
    } else if (conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [routeConvoId, conversations]);

  // Load messages when active conversation changes
  // TODO: fix messages state here
  useEffect(() => {
    if (!activeId || streaming) return;
    console.log("activ id", activeId);
    setLoadingMsgs(true);
    (async () => {
      try {
        const msgs: AskMessage[] = await listMessages(activeId);
        console.log("messageeeee", msgs);
        // setMessages(msgs.map((m: DbMessage) => ({ id: m.id, role: m.role, content: m.content })));
        setMessages(
          msgs.flatMap((m) => [
            {
              id: `q_${m.id}`,
              role: "user",
              content: m.question,
            },
            {
              id: `a_${m.id}`,
              role: "assistant",
              content: m.answer,
              audioUrl: m.audioUrl,
              imageUrl: m.imageUrl,

              responseMode: m.responseMode,
              journeyData: m.journeyData,
            },
          ]),
        );
      } catch {
        toast.error(t("couldntLoadMessages"));
      } finally {
        setLoadingMsgs(false);
      }
    })();
  }, [activeId, streaming]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await dbDeleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeId === id) {
          setActiveId(null);
          setMessages([]);
        }
        toast.success(t("chatRemoved"));
      } catch {
        toast.error(t("couldntDeleteChat"));
      }
    },
    [activeId],
  );

  const handleSend = async (text: string, files: File[] = []) => {
    if(mode==="drawing" && drawingStarted){
      const userMessage={
        id:Date.now(),
        role:"user" as const,
        content:text
      }

      setMessages(prev=>[...prev,userMessage]);

      try{
        setStreaming(true);
        const res=await sendDrawingStoryMessage({
          conversationId:drawingConversationId,
          message:text,
        });
        console.log("DRAWING RESPONSE =", res);
        setStreaming(false);
        

        if (res.data.finished) {
          setDrawingFinished(true);
        }else{
        setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: "assistant",
          content: res.data.reply,
        },
      ]);
      }
      }catch (e) {
        console.error(e);
        toast.error("Couldn't send message");
      } finally {
          setStreaming(false);
      }
      return
    }

    if (!user) return;
    let convoId = activeId;
    // Auto-create conversation if none active
    if (!convoId) {
      try {
        const c = await createConversation(text.slice(0, 40));
        setConversations((prev) => [c, ...prev]);
        setActiveId(c.id);
        convoId = c.id;
      } catch {
        toast.error(t("couldntStartChat"));
        return;
      }
    }

    // Persist user message + optimistic UI
    const optimisticUser: UiMessage = {
      id: `tmp_${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, optimisticUser]);

    // Add empty assistant placeholder
    const assistantTmpId = `asst_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantTmpId, role: "assistant", content: "", streaming: true },
    ]);
    setStreaming(true);
    abortRef.current = { aborted: false };

    let acc = "";
    await streamChat({
      question: text,
      conversationId: convoId!,
      files,
      mode,
      onDelta: (chunk) => {
        if (abortRef.current.aborted) return;
        acc += chunk;
        setMessages((prev) => {
          const newMessages = prev.map((m) =>
            m.id === assistantTmpId ? { ...m, content: acc } : m,
          );
          return newMessages;
        });
      },
      onDone: async () => {
        setStreaming(false);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTmpId ? { ...m, streaming: false } : m,
          ),
        );
      },
      onError: (msg) => {
        setStreaming(false);
        setMessages((prev) => prev.filter((m) => m.id !== assistantTmpId));
        toast.error(msg);
      },
      onAudio: (audioUrl) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantTmpId ? { ...m, audioUrl } : m)),
        );
      },

      onImage: (imageUrl) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantTmpId ? { ...m, imageUrl } : m)),
        );
      },
    });
  };

  const handleStop = () => {
    abortRef.current.aborted = true;
    setStreaming(false);
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)),
    );
  };

useEffect(() => {
  console.log("drawingStarted =", drawingStarted);
}, [drawingStarted]);

useEffect(() => {
  console.log("mode =", mode);
}, [mode]);

const handleStartDrawing = async (file: File) => {
  try {
        console.log("START DRAWING");

    setDrawingLoading(true);

    const res = await startDrawingStory(file);
    console.log("API SUCCESS");

    setDrawingConversationId(res.data.conversationId);
    console.log("before setDrawingStarted");

    setMode("drawing");
setDrawingStarted(true);
    console.log("after setDrawingStarted");

    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: res.data.reply,
      },
    ]);
  } catch (e) {
    toast.error("Couldn't analyze drawing");
  } finally {
    setDrawingLoading(false);
  }
};

  const handleGenerateStory = async () => {
  if (!drawingConversationId) return;

  try {
    setDrawingStatus("Starting...");
    setDrawingLoading(true);
    console.log("drawingConversationId =", drawingConversationId);
    const res = await generateStoryFromDrawing({
      conversationId: drawingConversationId,
    });
    // await new Promise((r) => setTimeout(r, 1000));
    // await new Promise((r) => setTimeout(r, 1000));
    toast.success("Story created!");
    navigate("/my-stories");
  } catch {
    toast.error("Couldn't generate story");
  } finally {
    setDrawingLoading(false);
    setDrawingStatus("")
  }
};
console.log("CHAT PAGE drawingStarted =", drawingStarted);
  const showEmpty = !loadingMsgs && messages.length === 0;

  return (
    <div className="min-h-screen bg-background relative flex">
      <div
        className="absolute inset-0 playful-bg opacity-40 pointer-events-none"
        aria-hidden
      />
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

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border/50 px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
            aria-label={t("openChats")}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-button">
              <Sparkles
                className="w-4 h-4 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
            <span className="font-bold">{t("sparkyName")}</span>
          </div>
          <ChatTopControls />
        </header>

        {/* Desktop floating controls (theme + logout) */}
        <div className="hidden lg:flex absolute top-4 right-4 z-30 animate-fade-slide-up">
          <ChatTopControls />
        </div>

        {/* Messages scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-6"
        >
          <div className="max-w-3xl mx-auto space-y-4">
            {loadingMsgs ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="h-16 flex-1 max-w-md rounded-2xl bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : showEmpty ? (
              <div className="flex flex-col items-center text-center py-12 animate-fade-slide-up">
                <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-card mb-5">
                  <Bot
                    className="w-10 h-10 text-primary-foreground"
                    strokeWidth={2.2}
                  />
                </div>
                <h1 className="text-3xl font-bold mb-2">{t("chatWelcome")}</h1>
                <p className="text-muted-foreground mb-8 max-w-md">
                  {t("chatDescription")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s.text}
                      onClick={() => handleSend(s.text)}
                      disabled={streaming}
                      className="text-left p-4 rounded-2xl bg-card border-2 border-border/60 hover:border-primary/50 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="text-2xl mb-1">{s.emoji}</div>
                      <div className="text-sm font-semibold">{s.text}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* {messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    isStreaming={m.streaming}
                    audioUrl={m.audioUrl}
                    imageUrl={m.imageUrl}
                  />
                ))} */}
                {messages.map((m) => {
                if (m.role === "assistant" && m.responseMode === "journey") {
                  return (
                    <JourneyMessage
                      key={m.id}
                      content={m.content}
                      audioUrl={m.audioUrl}
                      imageUrl={m.imageUrl}
                    />
                  );
                }

                return (
                  <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.content}
                    imageUrl={m.imageUrl}
                    audioUrl={m.audioUrl}
                  />
                );
              })}
                {streaming && messages[messages.length - 1]?.content === "" && (
                  <TypingIndicator />
                )}
              </>
            )}
          </div>
        </div>

        {drawingFinished && (
        <div className="flex justify-center mb-4">
          <button
            onClick={handleGenerateStory}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl"
            disabled={drawingLoading}
          >
            {drawingLoading
              ? drawingStatus
              : "Bring My Drawing To Life"}
          </button>
        </div>
      )}

        <ChatInput
          onSend={handleSend}
          disabled={streaming}
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
