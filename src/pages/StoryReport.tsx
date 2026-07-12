import { useEffect, useState } from "react";
import {
  useLocation,
  useParams,
} from "react-router-dom";

import PlayfulBackground from "@/components/PlayfulBackground";
import { AsyncFeedback } from "@/components/ui/async-feedback";
import { PageState } from "@/components/ui/page-state";

import { getStoryReport } from "@/lib/reports";

import {
  Trophy,
  Target,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
type Evaluation = {
  id: number;
  score: number;
  feedback: string;

  answer: {
    answer: string;

    question: {
      question: string;
    };
  };
};

type StoryReportResponse = {
  report: {
    overallScore: number;
    summary: string;
    goalAchievement: number;
    strengths: string[];
    improvements: string[];
  };

  evaluations: Evaluation[];
};
export default function StoryReport () {
  const { storyId } = useParams();

  const location = useLocation();

  const storyTitle = location.state?.storyTitle;

  const educationalGoal = location.state?.educationalGoal;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [data, setData] = useState<StoryReportResponse | null>(null);

  const {t} = useTranslation()

  useEffect(() => {
    const load = async () => {
        try{
            setLoading(true)
            setError("")
            const res = await getStoryReport(Number(storyId))
            setData(res.data)
        }catch(err){
            console.log(err)
            setError("The story report could not be loaded.")
        }finally{
            setLoading(false)
        }
    }
    load()
  },[storyId])

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <AsyncFeedback
          tone="loading"
          title="Loading story report"
          message="Gathering the evaluation summary and question-by-question feedback."
        />
      </div>
    </div>
  );
    }

  if (error || !data) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <PageState
          icon={FileText}
          title="Report not available"
          description={error || "This report could not be found."}
          tone="warning"
        />
      </div>
    </div>
  );
}

const report = data.report;

const evaluations =
  data.evaluations;
  return(
    <div className="min-h-screen bg-background relative">

        <PlayfulBackground />

        <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-8">

        <h1 className="text-4xl font-bold">
        {storyTitle || "Story Report"}
        </h1>

        {educationalGoal && (
        <p className="text-muted-foreground mt-2">
        {t("Goal")}: {educationalGoal}
        </p>
        )}

        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-8">

        <div className="bg-card border rounded-2xl p-6">

        <Trophy className="mb-3 text-yellow-500" />

        <p className="text-muted-foreground">
        {t("Overall Score")}
        </p>

        <h2 className="text-4xl font-bold">
        {report.overallScore}%
        </h2>

        <div className="mt-4 h-3 rounded-full bg-muted">
        <div
        className="h-3 rounded-full bg-yellow-500"
        style={{
        width: `${report.overallScore}%`,
        }}
        />
        </div>

        </div>

        <div className="bg-card border rounded-2xl p-6">

        <Target className="mb-3 text-green-500" />

        <p className="text-muted-foreground">
        {t("Goal Achievement")}
        </p>

        <h2 className="text-4xl font-bold">
        {report.goalAchievement}%
        </h2>

        <div className="mt-4 h-3 rounded-full bg-muted">
        <div
        className="h-3 rounded-full bg-green-500"
        style={{
        width: `${report.goalAchievement}%`,
        }}
        />
        </div>

        </div>

        </div>
        <div className="bg-card border rounded-2xl p-6 mb-8">

        <h2 className="font-bold text-xl mb-3">
        {t("Summary")}
        </h2>

        <p>
        {report.summary}
        </p>

        </div>
        <div className="bg-card border rounded-2xl p-6 mb-8">

        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">

        <CheckCircle className="text-green-500" />

        {t("Strengths")}

        </h2>

        <div className="space-y-3">

        {report.strengths.map(
        (strength, index) => (

        <div
        key={index}
        className="flex gap-3"
        >

        <CheckCircle
        className="
        w-5
        h-5
        text-green-500
        shrink-0
        mt-0.5
        "
        />

        <p>{strength}</p>

        </div>

        )
        )}

        </div>

        </div>
        <div className="bg-card border rounded-2xl p-6 mb-8">

        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">

        <AlertTriangle className="text-orange-500" />

        {t("Improvements")}

        </h2>

        <div className="space-y-3">

        {report.improvements.map(
        (item, index) => (

        <div
        key={index}
        className="flex gap-3"
        >

        <AlertTriangle
        className="
        w-5
        h-5
        text-orange-500
        shrink-0
        mt-0.5
        "
        />

        <p>{item}</p>

        </div>

        )
        )}

        </div>

        </div>
        <h2 className="text-2xl font-bold mb-4">
        {t("Questions Evaluation")}
        </h2>

        <div className="space-y-4">

        {evaluations.map((evaluation) => (

        <div
        key={evaluation.id}
        className="
        bg-card
        border
        rounded-2xl
        p-5
        "
        >

        <div className="flex justify-between mb-4">

        <h3 className="font-semibold">

        {
        evaluation.answer.question
        .question
        }

        </h3>

        <div
        className="
        bg-primary/10
        text-primary
        px-3
        py-1
        rounded-full
        font-bold
        "
        >

        {evaluation.score}%

        </div>

        </div>

        <div className="mb-4">

        <p className="text-sm text-muted-foreground mb-1">
        {t("Child Answer")}
        </p>

        <p className="font-medium">
        {
        evaluation.answer.answer
        }
        </p>

        </div>

        <div className="bg-muted rounded-xl p-4">

        <div className="flex items-center gap-2 mb-2">

        <MessageSquare className="w-4 h-4" />

        <span className="font-medium">
        {t("AI Feedback")}
        </span>

        </div>

        <p>
        {evaluation.feedback}
        </p>

        </div>

        </div>

        ))}

        </div>
        </div>
    </div>
);
}
