import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { BookOpen, ChevronLeft, ChevronRight, Mic, Trophy, Volume2 } from "lucide-react";
import Confetti from "react-confetti";
import { useTranslation } from "react-i18next";

import { submitAnswers } from "@/lib/questions";
import {
  generateQuestionAudio,
  getChildStories,
  getMyStories,
  speechToTextQuestion,
} from "@/lib/story";

interface StoryQuestion {
  id: number;
  question: string;
}

interface StoryScene {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  startTime?: number | null;
  endTime?: number | null;
}

interface StoryRecord {
  id: number;
  title: string;
  content: string;
  audioUrl?: string | null;
  scenes: StoryScene[];
  questions: StoryQuestion[];
}

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${baseUrl}${url}`;
};

export default function MyStories() {
  const { childId } = useParams();
  const { t } = useTranslation();

  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryRecord | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answersSubmitted, setAnswersSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const [recordingQuestionId, setRecordingQuestionId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async (questionId: number) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      chunksRef.current.push(event.data);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecordingQuestionId(questionId);
  };

  const stopRecording = async (questionId: number) => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) return;

    recorder.stop();

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, {
        type: "audio/webm",
      });

      const response = await speechToTextQuestion(questionId, blob);

      setAnswers((prev) => ({
        ...prev,
        [questionId]: response.data.text,
      }));

      setRecordingQuestionId(null);
    };
  };

  useEffect(() => {
    const load = async () => {
      const response = childId
        ? await getChildStories(Number(childId))
        : await getMyStories();

      setStories(response.data);
    };

    void load();
  }, [childId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selectedStory) return;

    const onTimeUpdate = () => {
      const time = audio.currentTime;

      const index = selectedStory.scenes.findIndex(
        (scene) =>
          scene.startTime != null &&
          scene.endTime != null &&
          time >= scene.startTime &&
          time < scene.endTime,
      );

      if (index !== -1) {
        setCurrentSceneIndex(index);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => audio.removeEventListener("timeupdate", onTimeUpdate);
  }, [selectedStory]);

  useEffect(() => {
    setCurrentSceneIndex(0);
  }, [selectedStory]);

  useEffect(() => {
    if (!selectedStory) return;

    const hasQuestions = selectedStory.questions?.length > 0;

    if (
      hasQuestions &&
      !selectedStory.audioUrl &&
      currentSceneIndex === selectedStory.scenes.length - 1
    ) {
      setShowQuestions(true);
    }
  }, [currentSceneIndex, selectedStory]);

  const handleSubmitAnswers = async () => {
    if (!selectedStory || answersSubmitted) return;

    try {
      await submitAnswers(selectedStory.id, {
        answers: selectedStory.questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] || "",
        })),
      });

      setAnswersSubmitted(true);
      setShowQuestions(false);
      setShowConfetti(true);
      window.setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlayQuestionAudio = async (questionId: number) => {
    try {
      setPlayingAudioId(questionId);

      const response = await generateQuestionAudio(questionId);
      const audio = new Audio(resolveAssetUrl(response.data.audioUrl));

      void audio.play();
      audio.onended = () => {
        setPlayingAudioId(null);
      };
    } catch (error) {
      console.log(error);
      setPlayingAudioId(null);
    }
  };

  if (!selectedStory) {
    return (
      <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-[2rem] border border-border/50 bg-card/85 p-6 shadow-card backdrop-blur-sm">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BookOpen className="h-3.5 w-3.5" />
                {t("storyLibraryBadge")}
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("storyLibraryTitle")}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                {t("storyLibraryDescription")}
              </p>
            </div>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/70 p-10 text-center shadow-soft">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-xl font-bold">{t("storyLibraryEmptyTitle")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("storyLibraryEmptyDescription")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stories.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  onClick={() => {
                    setSelectedStory(story);
                    setShowQuestions(false);
                    setAnswers({});
                    setCurrentSceneIndex(0);
                    setAnswersSubmitted(false);
                  }}
                  className="group rounded-[2rem] border border-border/60 bg-card/90 p-5 text-left shadow-soft transition-all hover:-translate-y-1 hover:shadow-card"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{story.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("storySceneCount", { count: story.scenes.length })}
                        {story.questions.length > 0
                          ? ` - ${t("storyQuestionCount", { count: story.questions.length })}`
                          : ""}
                      </p>
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {t("storyRead")}
                    </div>
                  </div>

                  <p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
                    {story.content}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                    {t("storyOpen")}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const story = selectedStory;
  const scene = story.scenes[currentSceneIndex];
  const hasAudio = Boolean(story.audioUrl);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-100 px-4 pb-12 pt-24 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 sm:px-6">
      {showConfetti ? (
        <>
          <div className="pointer-events-none fixed inset-0 z-[100]">
            <Confetti />
          </div>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="rounded-[2rem] border border-border bg-card p-8 text-center text-card-foreground shadow-2xl">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Trophy className="h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold">{t("storyCelebrationTitle")}</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {t("storyCelebrationDescription")}
              </p>
            </div>
          </div>
        </>
      ) : null}

      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <button
            type="button"
            onClick={() => setSelectedStory(null)}
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border bg-card/90 px-4 py-2 text-sm font-semibold text-card-foreground shadow-soft backdrop-blur-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </button>

          <div className="rounded-2xl bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-soft backdrop-blur-sm">
            {t("storySceneProgress", {
              current: currentSceneIndex + 1,
              total: story.scenes.length,
            })}
          </div>
        </div>

        {hasAudio ? (
          <div className="mb-4 rounded-[1.75rem] border border-border/60 bg-card/90 p-4 shadow-soft backdrop-blur-sm">
            <div className="mb-2 text-sm font-semibold text-foreground">{t("storyAudioLabel")}</div>
            <audio
              ref={audioRef}
              controls
              className="w-full"
              onEnded={() => {
                if (story.questions.length > 0) {
                  setShowQuestions(true);
                }
              }}
            >
              <source src={resolveAssetUrl(story.audioUrl)} type="audio/mpeg" />
            </audio>
          </div>
        ) : null}

        <div className="mb-4 rounded-full bg-white/70 p-1 shadow-soft backdrop-blur-sm dark:bg-slate-900/70">
          <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${((currentSceneIndex + 1) / story.scenes.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <article className="rounded-[2rem] bg-white/85 p-5 shadow-2xl backdrop-blur dark:bg-slate-900/85 sm:p-8">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">{scene?.title}</h2>

          <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[2rem] bg-white/60 px-4 py-4 dark:bg-slate-800/40 sm:min-h-[420px]">
            {scene?.imageUrl ? (
              <img
                src={resolveAssetUrl(scene.imageUrl)}
                className="max-h-[52vh] max-w-full rounded-[1.5rem] object-contain shadow-soft"
                alt={scene.title}
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                {t("storyTextOnlyScene")}
              </div>
            )
            }
          </div>

          <div className="mx-auto mt-6 max-w-4xl rounded-[2rem] bg-white/75 px-6 py-5 shadow-soft dark:bg-slate-800/50">
            <p className="text-lg leading-9 text-slate-700 dark:text-slate-200 sm:text-xl">
              {scene?.content}
            </p>
          </div>
        </article>

        {!hasAudio ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentSceneIndex((prev) => prev - 1)}
              disabled={currentSceneIndex === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-card-foreground shadow-soft disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              {t("storyPreviousScene")}
            </button>

            <button
              type="button"
              onClick={() => setCurrentSceneIndex((prev) => prev + 1)}
              disabled={currentSceneIndex === story.scenes.length - 1}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-40"
            >
              {t("storyNextScene")}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {showQuestions ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold">{t("storyQuestionsTitle")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("storyQuestionsDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestions(false)}
                className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground"
              >
                {t("close")}
              </button>
            </div>

            <div className="space-y-5">
              {story.questions.map((question, index) => (
                <div key={question.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-base font-medium">{question.question}</p>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handlePlayQuestionAudio(question.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"
                    >
                      <Volume2 className="h-4 w-4" />
                      {playingAudioId === question.id
                        ? t("storyQuestionPlaying")
                        : t("storyQuestionPlay")}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        recordingQuestionId === question.id
                          ? stopRecording(question.id)
                          : startRecording(question.id)
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive"
                    >
                      <Mic className="h-4 w-4" />
                      {recordingQuestionId === question.id
                        ? t("storyQuestionStopRecording")
                        : t("storyQuestionRecord")}
                    </button>
                  </div>

                  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-input bg-background p-3 text-foreground"
                    value={answers[question.id] || ""}
                    onChange={(event) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [question.id]: event.target.value,
                      }))
                    }
                    placeholder={t("storyQuestionAnswerPlaceholder")}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{t("storyQuestionsFooter")}</p>
              <button
                type="button"
                disabled={answersSubmitted}
                onClick={handleSubmitAnswers}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trophy className="h-4 w-4" />
                {answersSubmitted ? t("storyAnswersSubmitted") : t("storySubmitAnswers")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
