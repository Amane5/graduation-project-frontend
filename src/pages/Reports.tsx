import { useEffect, useMemo, useState } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import PlayfulBackground from "@/components/PlayfulBackground";
import { AsyncFeedback } from "@/components/ui/async-feedback";
import { PageState } from "@/components/ui/page-state";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

import { getChildren } from "@/lib/children";
import { getChatReport, getChildReport } from "@/lib/reports";

import {
  BookOpen,
  Trophy,
  Target,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type Report = {
  id: number;
  storyId: number;
  overallScore: number;
  goalAchievement: number;
  summary: string;
  createdAt: string;

  story: {
    id: number;
    title: string;
    educationalGoal: string;
    createdAt: string;
  };
};

type ChatReport = {
  id: number;
  childId: number;
  createdAt: string;

  curiosityAvg: number;
  creativityAvg: number;
  analyticalAvg: number;

  topCategories: string[];
  topSubcategories: string[];

  recommendations: string[];
  emotionalSummary?: string | null;
  insights?: unknown;
};

export default function Reports()  {
  const navigate = useNavigate();

  const [storyReports, setStoryReports] = useState<Report[]>([]);

  const [chatReport, setChatReport] = useState<ChatReport | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState<"story" | "chat">("story");

  const { childId } = useParams();

  const location = useLocation();

  const {t} = useTranslation()

  const childName = location.state?.childName;

  //useeffect to get story reports 
  useEffect(() => {
     if (!childId) return;
     if (activeTab !== "story") return;
    const loadReports = async () => {
        try{
            setLoading(true)
            setLoadError("")
            const res = await getChildReport(Number(childId))
            setStoryReports(res.data.reports || [])

        }catch(err){
            console.log(err)
            setLoadError("The story reports could not be loaded.")
        }finally{
            setLoading(false)
        }
    }
    loadReports()
  },[childId, activeTab])

  // useeffect to get chat reports
  useEffect(() => {
    if (!childId) return;
    if (activeTab !== "chat") return;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await getChatReport(Number(childId));
console.log(res);
        setChatReport(res.data || null);
      } catch (err) {
        console.log(err);
        setLoadError("The chat report could not be loaded.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [childId, activeTab]);

  const chatStats = {
  curiosity: Math.round(chatReport?.curiosityAvg || 0),
  creativity: Math.round(chatReport?.creativityAvg || 0),
  analytical: Math.round(chatReport?.analyticalAvg || 0),
  topCategories: chatReport?.topCategories || [],
  topSubcategories: chatReport?.topSubcategories || [],
  recommendations: chatReport?.recommendations || [],
  emotionalSummary: chatReport?.emotionalSummary || null,
  };

  const stats = useMemo(() => {
    const storiesCount = storyReports.length;

    const avgScore =
      storiesCount === 0
        ? 0
        : Math.round(
            storyReports.reduce(
              (acc, r) => acc + r.overallScore,
              0
            ) / storiesCount
          );

    const avgGoal =
      storiesCount === 0
        ? 0
        : Math.round(
            storyReports.reduce(
              (acc, r) =>
                acc + r.goalAchievement,
              0
            ) / storiesCount
          );

    return {
      storiesCount,
      avgScore,
      avgGoal,
    };
  }, [storyReports]);

  return (
    <div className="min-h-screen bg-background relative">

    <PlayfulBackground />

    <div className="max-w-6xl mx-auto px-4 py-8">

      <h1 className="text-4xl font-bold mb-6">
        {childName} {t("Reports")} 📊
      </h1>

    <div className="flex gap-2 mb-6">
    <button
      onClick={() => setActiveTab("story")}
      className={`px-4 py-2 rounded-xl border transition ${
        activeTab === "story"
          ? "bg-primary text-white"
          : "bg-card"
      }`}
    >
      {t("Story")}
    </button>

    <button
      onClick={() => setActiveTab("chat")}
      className={`px-4 py-2 rounded-xl border transition ${
        activeTab === "chat"
          ? "bg-primary text-white"
          : "bg-card"
      }`}
    >
      {t("Chat")}
    </button>
  </div>
   
    {loading ? (
      <AsyncFeedback
        tone="loading"
        title={activeTab === "story" ? t("Loading story reports") : t("Loading chat report")}
        message={t("Fetching the latest report data for this child.")}
        className="mb-6"
      />
    ) : null}

    {!loading && loadError ? (
      <PageState
        icon={FileText}
        title="Couldn't load reports"
        description={loadError}
        actionLabel={t("tryAgain")}
        onAction={() => window.location.reload()}
        tone="warning"
        className="mb-6"
      />
    ) : null}

    {!loading && !loadError && activeTab === "story" && (
      
      <div className="grid gap-4">
         <div className="grid md:grid-cols-3 gap-4 mb-8">

      <div className="bg-card rounded-2xl p-5 border">
        <BookOpen className="mb-2" />
        <p className="text-sm text-muted-foreground">
            {t("Stories")}
        </p>
        <h2 className="text-3xl font-bold">
            {stats.storiesCount}
        </h2>
      </div>

      <div className="bg-card rounded-2xl p-5 border">
        <Trophy className="mb-2" />
        <p className="text-sm text-muted-foreground">
            {t("Average Score")}
        </p>
        <h2 className="text-3xl font-bold">
            {stats.avgScore}%
        </h2>
      </div>

      <div className="bg-card rounded-2xl p-5 border">
        <Target className="mb-2" />
        <p className="text-sm text-muted-foreground">
            {t("Goal Achievement")}
        </p>
        <h2 className="text-3xl font-bold">
            {stats.avgGoal}%
        </h2>
      </div>

    </div>
        {storyReports.length === 0 ? (
        <PageState
          icon={BookOpen}
          title={t("No story reports yet")}
          description={t("Reports appear here after a child completes story questions.")}
        />
        ) : null}

        {storyReports.map((report) => (
        <div
            key={report.id}
            className="bg-card border rounded-2xl p-5"
        >
            <div className="flex justify-between items-center">

            <div>
                <h3 className="font-bold text-xl">
                {report.story.title}
                </h3>

                <p className="text-muted-foreground">
                {report.story.educationalGoal}
                </p>
            </div>

            <div className="text-right">

                <p>
                {t("Score")}
                {" "}
                {report.overallScore}%
                </p>

                <Button
                className="mt-2"
                onClick={() =>
                    navigate(
                    `/reports/story/${report.storyId}`,
                    {
                        state:{
                            storyTitle: report.story.title,
                            educationalGoal:
                            report.story.educationalGoal,
                        }
                    }
                    )
                }
                >
                {t("View Report")}
                </Button>

            </div>

            </div>
        </div>
        ))}
      </div>
    )}
      
    {!loading && !loadError && activeTab === "chat" && (
      <div className="bg-card border rounded-2xl p-6 text-center">
        <div className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
    
      <div className="bg-card border rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">{t("Curiosity")}</p>
        <h2 className="text-3xl font-bold">{chatStats.curiosity}/5</h2>
      </div>

      <div className="bg-card border rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">{t("Creativity")}</p>
        <h2 className="text-3xl font-bold">{chatStats.creativity}/5</h2>
      </div>

      <div className="bg-card border rounded-2xl p-5">
        <p className="text-sm text-muted-foreground">{t("Analytical")}</p>
        <h2 className="text-3xl font-bold">{chatStats.analytical}/5</h2>
      </div>
    </div>


      {chatReport ? (
      <>
      {/* Top Interests */}
    <div className="bg-card border rounded-2xl p-5">
      <h3 className="font-bold mb-3">{t("Top Interests")}</h3>

      <div className="flex flex-wrap gap-2">
        {chatStats.topCategories.map((cat) => (
          <span
            key={cat}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary"
          >
            {cat}
          </span>
        ))}
      </div>
    </div>

      {/* Top Subcategories */}
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-bold mb-3">
          {t("Top Subcategories")}
        </h3>

        <div className="flex flex-wrap gap-2">
          {chatReport?.topSubcategories?.map((sub) => (
            <span
              key={sub}
              className="px-3 py-1 rounded-full bg-secondary"
            >
              {sub}
            </span>
          ))}
        </div>

        
      </div>

      {/* emotional */}
      <div className="bg-card border rounded-2xl p-5">
          <h3 className="font-bold mb-3">
            {t("Emotional Summary")}
          </h3>

          <p className="text-muted-foreground">
            {chatReport?.emotionalSummary ||
              t("Not enough emotional signals yet")
            }
          </p>
      </div>


      {chatStats.recommendations.length > 0 && (
      <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-bold mb-3">{t("Recommendations")}</h3>

        <div className="flex flex-wrap gap-2">
          {chatStats.recommendations.map((rec) => (
            <span key={rec} className="px-3 py-1 rounded-full bg-primary/10 text-primary">
              {rec}
            </span>
          ))}
        </div>
      </div>
      )}
      </>
      ) : (
      <PageState
        icon={FileText}
        title={t("No chat report yet")}
        description={t("Chat insights appear here after enough conversations have been analyzed.")}
      />
      )}

      {/* <div className="bg-card border rounded-2xl p-5">
        <h3 className="font-bold mb-2">Chat Insights</h3>

        <p className="text-muted-foreground">
          Based on conversations, your child shows patterns in:
          curiosity, learning behavior, and preferred topics.
        </p>
      </div> */}
  </div>
      </div>
    )}
    </div>
    </div>
);
}
