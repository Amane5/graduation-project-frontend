import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Users,
  MessageCircleQuestion,
  UserPlus,
  BookOpen,
  UsersRound,
  AlertCircle,
  PlusCircle,
  BarChart3,
  Sparkles,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import ChildCard from "@/components/dashboard/ChildCard";
import ChildCardSkeleton from "@/components/dashboard/ChildCardSkeleton";
import QuickActionCard from "@/components/dashboard/QuickActionCard";
import DeleteChildModal from "@/components/dashboard/DeleteChildModal";
import PlayfulBackground from "@/components/PlayfulBackground";
import { Button } from "@/components/ui/button";
import {
  Child,
  getDashboardStats,
  type DashboardStats,
  getChildren,
  deleteChildById,
} from "@/lib/children";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
      setChildren((prev) => prev.filter((c) => c.id !== child.id));
      toast.success(t("childRemoved"));
    } catch {
      toast.error(t("failedDeleteChild"));
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 playful-bg opacity-60" />
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold">
              {t("welcomeBack")} {greetingName} 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("dashboardDescription")}
            </p>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <StatCard
              label={t("totalChildren")}
              value={stats.totalChildren}
              icon={Users}
              emoji="👶"
              gradient="from-primary to-primary-glow"
              delay={0}
            />
            <StatCard
              label={t("questionsToday")}
              value={stats.questionsToday}
              icon={MessageCircleQuestion}
              emoji="❓"
              gradient="from-secondary to-primary-glow"
              delay={100}
            />
          </section>

          <section>
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-2xl font-bold">{t("yourChildren")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("manageProfiles")}
                </p>
              </div>

              <Link to="/add-child">
                <Button variant="hero">
                  <PlusCircle className="w-4 h-4" />
                  {t("addChild")}
                </Button>
              </Link>
            </div>

            {state === "loading" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <ChildCardSkeleton key={i} delay={i * 80} />
                ))}
              </div>
            ) : null}

            {state === "error" ? (
              <div className="text-center p-10 border border-red-200 rounded-2xl">
                <AlertCircle className="mx-auto text-red-500" />
                <p className="mt-2">{t("failedLoadChildren")}</p>
              </div>
            ) : null}

            {state === "ready" && children.length === 0 ? (
              <div className="text-center p-10">
                <p>{t("noChildrenYet")}</p>
                <Link to="/add-child">
                  <Button className="mt-4">{t("addFirstChild")}</Button>
                </Link>
              </div>
            ) : null}

            {state === "ready" && children.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {children.map((child, i) => (
                  <ChildCard
                    key={child.id}
                    child={child}
                    onEdit={() =>
                      navigate(`/edit-child/${child.id}`, { state: child })
                    }
                    onDelete={() => setDeleting(child)}
                    onReports={() =>
                      navigate(`/reports/${child.id}`, {
                        state: {
                          childName: `${child.firstName} ${child.lastName}`,
                        },
                      })
                    }
                    delay={i * 80}
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-5">{t("quickActions")}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
