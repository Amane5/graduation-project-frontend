import { useEffect, useMemo, useState } from "react";
import { Edit2, Search, Sparkles, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  addQuestions,
  approveQuestions,
  deleteQuestion,
  generateQuestions,
  regenerateQuestions,
  updateQuestion,
} from "@/lib/questions";
import {
  approveStory,
  deleteStory,
  getChildrenStories,
  updateStory,
  updateStoryWithAi,
} from "@/lib/story";

type Scene = {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
};

type Question = {
  id: number;
  storyId: number;
  question: string;
};

type Story = {
  id: number;
  title: string;
  content: string;
  childName: string;
  status: string;
  audioUrl?: string | null;
  scenes: Scene[];
  questions: Question[];
  isApproved: boolean;
  questionsApproved: boolean;
};

type StoryApiRecord = {
  id: number;
  title: string;
  content: string;
  status: string;
  audioUrl?: string | null;
  scenes?: Scene[];
  questions?: Question[];
  isApproved: boolean;
  questionsApproved: boolean;
  child?: {
    firstName?: string;
  };
};

type StoryEditorMessage = {
  role: "user" | "assistant";
  text: string;
};

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${import.meta.env.VITE_API_URL}${url}`;
};

export default function ChildrenStories() {
  const { t } = useTranslation();

  const [stories, setStories] = useState<Story[]>([]);
  const [search, setSearch] = useState("");
  const [editingStoryId, setEditingStoryId] = useState<number | null>(null);
  const [savingStoryId, setSavingStoryId] = useState<number | null>(null);
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<StoryEditorMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [showAddQuestionForStory, setShowAddQuestionForStory] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [loadingStoryId, setLoadingStoryId] = useState<number | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await getChildrenStories();
        setStories(
          response.data.map((story: StoryApiRecord) => ({
            id: story.id,
            title: story.title,
            content: story.content,
            childName: story.child?.firstName || t("unknownChild"),
            status: story.status,
            audioUrl: story.audioUrl,
            scenes: story.scenes || [],
            questions: story.questions || [],
            isApproved: story.isApproved,
            questionsApproved: story.questionsApproved,
          })),
        );
      } catch (error) {
        console.log(error);
      }
    };

    void fetchStories();
  }, [t]);

  const filteredStories = useMemo(
    () =>
      stories.filter((story) =>
        (story.childName || "").toLowerCase().includes(search.toLowerCase()),
      ),
    [search, stories],
  );

  const updateStoryInState = (storyId: number, updater: (story: Story) => Story) => {
    setStories((prev) => prev.map((story) => (story.id === storyId ? updater(story) : story)));
  };

  const handleSaveEdit = async (story: Story) => {
    setSavingStoryId(story.id)
    try {
      const response = await updateStory(story.id, {
        scenes: story.scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          content: scene.content,
        })),
      });

      updateStoryInState(story.id, (current) => ({
        ...current,
        ...response.data.story,
        scenes: response.data.scenes,
        status: "DRAFT",
        isApproved: false,
        questionsApproved: false,
      }));

      if (selectedStory?.id === story.id) {
        setSelectedStory((prev) =>
          prev
            ? {
                ...prev,
                ...response.data.story,
                scenes: response.data.scenes,
                status: "DRAFT",
                isApproved: false,
                questionsApproved: false,
              }
            : null,
        );
      }

      setEditingStoryId(null);
    } catch (error) {
      console.log(error);
    } finally {
      setSavingStoryId(null);
    }
  };

  const handleApprove = async (storyId: number) => {
    try {
      await approveStory(storyId);
      updateStoryInState(storyId, (story) => ({ ...story, isApproved: true }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditWithAi = async () => {
    if (!aiMessage.trim() || !selectedStory) return;

    const message = aiMessage;
    setAiMessage("");

    try {
      setAiLoading(true);
      setChatMessages((prev) => [...prev, { role: "user", text: message }]);

      const response = await updateStoryWithAi(selectedStory.id, {
        editRequest: message,
      });

      updateStoryInState(selectedStory.id, (story) => ({
        ...story,
        title: response.data.story?.title || story.title,
        content: response.data.story?.content || story.content,
        scenes: response.data.scenes || story.scenes,
        audioUrl: response.data.story?.audioUrl || story.audioUrl,
        status: response.data.story?.status || story.status,
      }));

      setSelectedStory((prev) =>
        prev
          ? {
              ...prev,
              title: response.data.story?.title || prev.title,
              content: response.data.story?.content || prev.content,
              scenes: response.data.scenes || prev.scenes,
              audioUrl: response.data.story?.audioUrl || prev.audioUrl,
              status: response.data.story?.status || prev.status,
            }
          : null,
      );

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.data.summaryOfChanges || t("storyEditorUpdated"),
        },
      ]);
    } catch (error) {
      console.log(error);
      setAiMessage(message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (storyId: number) => {
    try {
      await deleteStory(storyId);
      setStories((prev) => prev.filter((story) => story.id !== storyId));
      if (selectedStory?.id === storyId) {
        setSelectedStory(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGenerateQuestions = async (storyId: number) => {
    try {
      setQuestionLoading(true);
      const response = await generateQuestions(storyId);
      updateStoryInState(storyId, (story) => ({ ...story, questions: response.data }));
    } catch (error) {
      console.log(error);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleRegenerateQuestions = async (storyId: number) => {
    try {
      setLoadingStoryId(storyId);
      const response = await regenerateQuestions(storyId);
      updateStoryInState(storyId, (story) => ({ ...story, questions: response.data }));
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingStoryId(null);
    }
  };

  const handleApproveQuestions = async (storyId: number) => {
    try {
      await approveQuestions(storyId);
      updateStoryInState(storyId, (story) => ({ ...story, status: "PUBLISHED" }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddQuestion = async (storyId: number) => {
    try {
      const response = await addQuestions(storyId, { question: newQuestion });
      updateStoryInState(storyId, (story) => ({
        ...story,
        questions: [...story.questions, response.data],
      }));
      setNewQuestion("");
      setShowAddQuestionForStory(null);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteQuestion = async (storyId: number, questionId: number) => {
    try {
      await deleteQuestion(questionId);
      updateStoryInState(storyId, (story) => ({
        ...story,
        questions: story.questions.filter((question) => question.id !== questionId),
      }));
    } catch (error) {
      console.log(error);
    }
  };

  const handleUpdateQuestion = async (storyId: number, questionId: number) => {
    try {
      const response = await updateQuestion(questionId, { question: editedQuestion });
      updateStoryInState(storyId, (story) => ({
        ...story,
        questions: story.questions.map((question) =>
          question.id === questionId ? response.data : question,
        ),
      }));

      setEditingQuestionId(null);
      setEditedQuestion("");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-card backdrop-blur-sm">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t("childrenStoriesBadge")}
          </div>
          <h1 className="text-4xl font-bold">{t("childrenStories")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("childrenStoriesDescription")}
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchByChildName")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-border bg-card py-4 pl-11 pr-4"
            />
          </div>
        </div>

        {filteredStories.length === 0 ? (
          <div className="rounded-2xl bg-card p-8 text-center shadow">
            {t("noStoriesFound")}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredStories.map((story) => {
              const isSaving = savingStoryId === story.id;
              return(
              <div
                key={story.id}
                className="overflow-hidden rounded-[2rem] border border-border/50 bg-card shadow-md"
              >
                <div className="p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{story.title}</h2>
                      <p className="mt-1 text-sm text-primary">
                        {t("child")}: {story.childName}
                      </p>
                    </div>

                    <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                      {t("status")}: {story.status}
                    </div>
                  </div>

                  <p className="whitespace-pre-line text-muted-foreground">{story.content}</p>

                  {story.audioUrl ? (
                    <audio key={story.audioUrl} controls className="mt-4 w-full">
                      <source src={resolveAssetUrl(story.audioUrl)} type="audio/mpeg" />
                    </audio>
                  ) : null}

                  <div className="mt-6 space-y-6">
                    {story.scenes.map((scene, index) => (
                      <div key={scene.id} className="border-t border-border/50 pt-4">
                        <h3 className="mb-3 text-lg font-semibold">
                          {t("storySceneLabel", { number: index + 1, title: scene.title })}
                        </h3>

                        {scene.imageUrl ? (
                          <img
                            src={resolveAssetUrl(scene.imageUrl)}
                            alt={scene.title}
                            className="mb-4 h-56 w-full rounded-2xl object-cover"
                          />
                        ) : null}

                        {editingStoryId === story.id ? (
                          <textarea
                            value={scene.content}
                            disabled={isSaving}
                            onChange={(event) => {
                              setStories((prev) =>
                                prev.map((candidate) =>
                                  candidate.id !== story.id
                                    ? candidate
                                    : {
                                        ...candidate,
                                        scenes: candidate.scenes.map((storyScene) =>
                                          storyScene.id === scene.id
                                            ? { ...storyScene, content: event.target.value }
                                            : storyScene,
                                        ),
                                      },
                                ),
                              );
                            }}
                            className="min-h-[180px] w-full rounded-2xl border border-input bg-background p-4 text-foreground"
                          />
                        ) : (
                          <div className="rounded-2xl bg-muted/20 p-4">
                            <p className="whitespace-pre-line text-base leading-7 text-foreground">
                              {scene.content}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {story.questions.length > 0 ? (
                      <div className="border-t border-border/50 pt-4">
                        <h3 className="mb-4 text-xl font-bold">{t("storyQuestionsTitle")}</h3>

                        {story.questions.map((question) => (
                          <div
                            key={question.id}
                            className="mb-3 rounded-2xl border border-border/60 p-4"
                          >
                            {editingQuestionId === question.id ? (
                              <>
                                <input
                                  value={editedQuestion}
                                  onChange={(event) => setEditedQuestion(event.target.value)}
                                  className="w-full rounded-xl border border-input bg-background p-3"
                                />

                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateQuestion(story.id, question.id)}>
                                    {t("save")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingQuestionId(null)}
                                  >
                                    {t("cancel")}
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-sm leading-6 text-foreground">
                                  {question.question}
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingQuestionId(question.id);
                                      setEditedQuestion(question.question);
                                    }}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => handleDeleteQuestion(story.id, question.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {showAddQuestionForStory === story.id ? (
                      <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                        <input
                          value={newQuestion}
                          onChange={(event) => setNewQuestion(event.target.value)}
                          className="w-full rounded-xl border border-input bg-background p-3"
                          placeholder={t("storyNewQuestionPlaceholder")}
                        />

                        <div className="mt-3 flex gap-2">
                          <Button onClick={() => handleAddQuestion(story.id)}>{t("save")}</Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowAddQuestionForStory(null)}
                          >
                            {t("cancel")}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {editingStoryId === story.id ? (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="bg-yellow-600 hover:bg-yellow-600/90" disabled={isSaving} loading={isSaving} loadingText={t("saving...")}>
                              {t("saveEdit")}
                            </Button>
                          </AlertDialogTrigger>

                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("saveEdit")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("childrenStoriesSaveEditConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isSaving}>{t("cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleSaveEdit(story)}>
                                {t("save")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button disabled={isSaving} variant="outline" onClick={() => setEditingStoryId(null)}>
                          {t("cancel")}
                        </Button>
                      </>
                    ) : (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="bg-red-600 hover:bg-red-600/90">
                            {t("delete")}
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("childrenStoriesDeleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("childrenStoriesDeleteDescription")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(story.id)}>
                              {t("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {/* <Button
                        onClick={() => {
                          setSelectedStory(story);
                          setEditingStoryId(story.id);
                        }}
                      >
                        {t("editStory")}
                      </Button> */}
                      {editingStoryId !== story.id ? (
                        <Button
                          onClick={() => {
                            setSelectedStory(story);
                            setEditingStoryId(story.id);
                          }}
                        >
                          {t("editStory")}
                        </Button>
                      ) : null}

                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedStory(story);
                          setShowAiEditor(true);
                        }}
                      >
                        {t("editUsingAI")}
                      </Button>

                      {!story.isApproved && story.status !== "PUBLISHED" ? (
                        <Button
                          className="bg-green-600 hover:bg-green-600/90"
                          onClick={() => handleApprove(story.id)}
                        >
                          {t("approveStory")}
                        </Button>
                      ) : null}

                      {story.isApproved &&
                      story.status !== "PUBLISHED" &&
                      story.questions.length === 0 ? (
                        <Button
                          onClick={() => handleGenerateQuestions(story.id)}
                          disabled={questionLoading}
                        >
                          {questionLoading
                            ? t("storyGeneratingQuestions")
                            : t("storyGenerateQuestions")}
                        </Button>
                      ) : null}

                      {story.isApproved &&
                      story.status !== "PUBLISHED" &&
                      story.questions.length > 0 ? (
                        <>
                          <Button onClick={() => handleApproveQuestions(story.id)}>
                            {t("storyApproveQuestions")}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => setShowAddQuestionForStory(story.id)}
                          >
                            {t("storyAddQuestion")}
                          </Button>
                        </>
                      ) : null}

                      {story.questions.length > 0 ? (
                        <Button
                          className="bg-orange-600 hover:bg-orange-600/90"
                          disabled={loadingStoryId === story.id}
                          onClick={() => handleRegenerateQuestions(story.id)}
                        >
                          {loadingStoryId === story.id
                            ? t("storyRegeneratingQuestions")
                            : t("storyRegenerateQuestions")}
                        </Button>
                      ) : null}
                    </>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {showAiEditor ? (
        <div className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="text-xl font-bold">{t("aiStoryEditor")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("childrenStoriesAiEditorDescription")}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAiEditor(false)}
              className="text-muted-foreground"
            >
              {t("close")}
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-xl p-3 ${
                  message.role === "user"
                    ? "ml-auto bg-purple-600 text-white"
                    : "bg-gray-200 text-black"
                }`}
              >
                {message.text}
              </div>
            ))}

            {aiLoading ? (
              <div className="w-fit rounded-xl bg-gray-200 p-3">
                {t("updatingStory")}
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 border-t p-4">
            <textarea
              value={aiMessage}
              onChange={(event) => {
                setAiMessage(event.target.value);
                event.target.style.height = "auto";
                event.target.style.height = `${event.target.scrollHeight}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleEditWithAi();
                }
              }}
              rows={1}
              placeholder={t("askAiToModifyStory")}
              className="min-h-[44px] max-h-[250px] flex-1 resize-none overflow-hidden rounded-xl border px-3 py-2 resize-none"
            />
            <Button onClick={handleEditWithAi} disabled={aiLoading || !aiMessage.trim()}>
              {t("send")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
