import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  MessageCircleQuestion,
  PlusCircle,
  Sparkles,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import ChildCard from "@/components/dashboard/ChildCard";
import ChildCardSkeleton from "@/components/dashboard/ChildCardSkeleton";
import DeleteChildModal from "@/components/dashboard/DeleteChildModal";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import StatCard from "@/components/dashboard/StatCard";
import PlayfulBackground from "@/components/PlayfulBackground";
import { Button } from "@/components/ui/button";
import { PageState } from "@/components/ui/page-state";
import { useAuth } from "@/contexts/AuthContext";
import {
  deleteChildById,
  getChildren,
  getDashboardStats,
  type Child,
  type DashboardStats,
} from "@/lib/children";

type LoadState = "loading" | "ready" | "error";

const Dashboard = () => {
  const { t } = useTranslation();
  const { firstName, username, accessToken } = useAuth();
  const navigate = useNavigate();

  const greetingName =
    firstName ||
    (username ? username.charAt(0).toUpperCase() + username.slice(1) : "there");

  const [state, setState] = useState<LoadState>("loading");
  const [children, setChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    questionsToday: 0,
    activeMinutes: null,
  });
  const [deleting, setDeleting] = useState<Child | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setState("loading");

        const [childrenResponse, dashboardStatsResponse] = await Promise.all([
          getChildren(),
          getDashboardStats(),
        ]);

        setChildren(childrenResponse.data || []);
        setStats(dashboardStatsResponse.data.data);
        setState("ready");
      } catch (err) {
        console.log(err);
        setState("error");
      }
    };

    if (accessToken) {
      void load();
    }

    window.addEventListener("focus", load);

    return () => window.removeEventListener("focus", load);
  }, [accessToken]);

  const handleDelete = async (child: Child) => {
    try {
      await deleteChildById(child.id);
      setChildren((prev) => prev.filter((candidate) => candidate.id !== child.id));
      toast.success(t("childRemoved"));
    } catch {
      toast.error(t("failedDeleteChild"));
    }
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 playful-bg opacity-60" />
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <section className="mb-8 overflow-hidden rounded-[2rem] border border-border/50 bg-card/85 p-6 shadow-card backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t("dashboardHeroBadge")}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {t("welcomeBack")} {greetingName} {"\u{1F44B}"}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  {t("dashboardDescription")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/add-child">
                  <Button variant="hero" className="w-full justify-between">
                    {t("addChild")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                <Link to="/story-generator">
                  <Button variant="outline" className="w-full justify-between">
                    {t("storyGenerator")}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              label={t("totalChildren")}
              value={stats.totalChildren}
              icon={Users}
              emoji={"👶"}
              gradient="from-primary to-primary-glow"
              delay={0}
            />
            <StatCard
              label={t("questionsToday")}
              value={stats.questionsToday}
              icon={MessageCircleQuestion}
              emoji={"❓"}
              gradient="from-secondary to-primary-glow"
              delay={100}
            />
          </section>

          <section>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">{t("yourChildren")}</h2>
                <p className="text-sm text-muted-foreground">{t("manageProfiles")}</p>
              </div>

              <Link to="/add-child">
                <Button variant="hero">
                  <PlusCircle className="h-4 w-4" />
                  {t("addChild")}
                </Button>
              </Link>
            </div>

            {state === "loading" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <ChildCardSkeleton key={item} delay={item * 80} />
                ))}
              </div>
            ) : null}

            {state === "error" ? (
              <PageState
                icon={AlertCircle}
                title={t("failedLoadChildren")}
                description={t("dashboardChildrenErrorHint")}
                tone="warning"
              />
            ) : null}

            {state === "ready" && children.length === 0 ? (
              <PageState
                icon={Users}
                title={t("noChildrenYet")}
                description={t("dashboardEmptyChildrenHint")}
                actionLabel={t("addFirstChild")}
                onAction={() => navigate("/add-child")}
              />
            ) : null}

            {state === "ready" && children.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {children.map((child, index) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onEdit={() => navigate(`/edit-child/${child.id}`, { state: child })}
                    onDelete={() => setDeleting(child)}
                    onReports={() =>
                      navigate(`/reports/${child.id}`, {
                        state: {
                          childName: `${child.firstName} ${child.lastName}`,
                        },
                      })
                    }
                    delay={index * 80}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-10">
            <h2 className="mb-5 text-2xl font-bold">{t("quickActions")}</h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <QuickActionCard
                to="/add-child"
                label={t("addChild")}
                description={t("createProfile")}
                icon={UserPlus}
                gradient="from-primary to-primary-glow"
              />
              <QuickActionCard
                to="/history"
                label={t("history")}
                description={t("viewChats")}
                icon={BookOpen}
                gradient="from-secondary to-primary-glow"
              />
              <QuickActionCard
                to="/accounts"
                label={t("accounts")}
                description={t("manageUsers")}
                icon={UsersRound}
                gradient="from-accent to-secondary"
              />
              <QuickActionCard
                to="/story-generator"
                label={t("storyGenerator")}
                description={t("createAIStories")}
                icon={Sparkles}
                gradient="from-purple-500 to-pink-500"
              />
              <QuickActionCard
                to="/challenges"
                label={t("challenges")}
                description={t("viewChildProgress")}
                icon={BarChart3}
                gradient="from-emerald-500 to-green-500"
              />
            </div>
          </section>
        </main>
      </div>

      <DeleteChildModal
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
        title={t("deleteChildTitle")}
        description={t("deleteChildDescription")}
        onConfirm={() => (deleting ? handleDelete(deleting) : undefined)}
      />
    </div>
  );
};

export default Dashboard;
