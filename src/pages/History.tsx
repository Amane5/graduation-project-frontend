import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  Eye,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import PlayfulBackground from "@/components/PlayfulBackground";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  listConversations,
  deleteConversation,
  histoyPage,
} from "@/lib/chat";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getChildren } from "@/lib/children";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const History = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const { id } = useParams();
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const childrenList = await getChildren();
        setChildren(childrenList.data || []);
        console.log("CHILDREN:", childrenList.data);
        if (childrenList.data?.length > 0) {
          setSelectedChild(childrenList[0].id);
        }
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (!selectedChild) return;

    const loadHistory = async () => {
      try {
        setState("loading");

        const list = await histoyPage(selectedChild);
        console.log("HISTORY:", list);
        setConvos(Object.values(list));
        setState("ready");
      } catch {
        setState("error");
      }
    };

    loadHistory();
  }, [selectedChild]);

  const filtered = convos.filter((c) =>
    c.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const handleDelete = async (id: number) => {
    console.log("DELETE ID:", id);
    setDeletingId(id);
    try {
      const res = await deleteConversation(id);
      console.log("DELETE RESPONSE:", res);
      setConvos((prev) => prev.filter((c) => c.id !== id));
     toast.success(t("conversationRemoved"));
    } catch (err) {
      console.log("DELETE ERROR:", err);
      toast.error(t("deleteConversationError"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 playful-bg opacity-60" aria-hidden />
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-slide-up">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
                {t("activityHistory")} <span className="text-3xl">📚</span>
              </h1>

              <p className="text-muted-foreground mt-1">
                {t("browseConversations")}
              </p>
            </div>

            <Select
              value={selectedChild ? String(selectedChild) : ""}
              onValueChange={(value) => setSelectedChild(Number(value))}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={t("chooseChild")} />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-4 mb-5 animate-fade-slide-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchByTopic")}
                className="pl-10"
              />
            </div>
          </div>
          {state === "idle" && (
            <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-soft">
              <h3 className="text-xl font-bold mb-2">{t("selectChildTitle")}</h3>

              <p className="text-muted-foreground text-sm">
                {t("selectChildDescription")}
              </p>
            </div>
          )}
          {state === "loading" && (
            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {t("loadingHistory")}
              </p>
            </div>
          )}

          {state === "error" && (
            <div className="bg-card rounded-2xl p-10 text-center border border-destructive/30">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-bold text-lg">{t("couldn'tLoadHistory")}</h3>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {t("tryAgain")}
              </Button>
            </div>
          )}

          {state === "ready" && selectedChild && convos.length === 0 && (
            <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-soft animate-scale-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center shadow-button mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-1">
                {convos.length === 0
                  ? t("noConversations")
                  : t("noMatchesFound")}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {convos.length === 0
                  ? t("startChattingDescription")
                  : t("differentSearchTerm")}
              </p>
              {/* {convos.length === 0 && (
                <Link to="/chat">
                  <Button variant="hero">{t("startChat")}</Button>
                </Link>
              )} */}
            </div>
          )}

          {state === "ready" && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((c, i) => (
                <div
                  key={c.id}
                  className="bg-card rounded-2xl border border-border/50 shadow-soft p-4 sm:p-5 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 animate-fade-slide-up opacity-0"
                  style={{
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-primary/10 flex items-center justify-center text-2xl shrink-0">
                      💬
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {c.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.lastActivity
                          ? format(new Date(c.lastActivity), "PPP · p")
                          : t("noDate")}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/chat/${c.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">{t("view")}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive"
                      >
                        {deletingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{t("delete")}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {state === "ready" && convos.length > 0 && filtered.length === 0 && (
            <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-soft">
              <h3 className="text-xl font-bold mb-1"> {t("noMatchesFound")}

              </h3>

              <p className="text-muted-foreground text-sm">
                {t("differentSearchTerm")}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default History;
