import { useEffect, useState } from "react";
import { CheckCircle2Icon, Edit2, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { AsyncFeedback } from "@/components/ui/async-feedback";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationHandler } from "@/hooks/useFirebaseNotifications";
import { getChildren } from "@/lib/children";
import {
  addQuestions,
  approveQuestions,
  deleteQuestion,
  generateQuestions,
  updateQuestion,
} from "@/lib/questions";
import {
  approveStory,
  generateStory,
  getStoryEditMessages,
  updateStory,
  updateStoryWithAi,
} from "@/lib/story";

interface ChildOption {
  id: number;
  firstName: string;
}

interface StoryScene {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
}

interface StoryMeta {
  id: number;
  title: string;
  content: string;
  audioUrl?: string | null;
  childId: number;
  isApproved: boolean;
  status: string;
}

interface QuestionRecord {
  id: number;
  question: string;
}

interface GeneratedStoryPayload {
  story: StoryMeta;
  scenes: StoryScene[];
  summaryOfChanges?: string;
}

interface StoryEditMessage {
  role: "user" | "assistant";
  text: string;
}

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${baseUrl}${url}`;
};

export default function StoryForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    behavior: "",
    length: "",
    type: "",
    withImage: false,
    withAudio: false,
  });
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [generatedStory, setGeneratedStory] = useState<GeneratedStoryPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [childrenState, setChildrenState] = useState<"loading" | "ready" | "error">("loading");
  const [isEditing, setIsEditing] = useState(false);
  const [showAiEditor, setShowAiEditor] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<StoryEditMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [editorMessagesLoading, setEditorMessagesLoading] = useState(false);
  const [storyApproved, setStoryApproved] = useState(false);
  const [questions, setQuestions] = useState<QuestionRecord[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [questionLoading, setQuestionLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [approvingStory, setApprovingStory] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<number | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null);
  const [approvingQuestions, setApprovingQuestions] = useState(false);
  const [generationStep, setGenerationStep] = useState("");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "loading" | "success" | "error" | "info";
    title?: string;
    message: string;
  } | null>(null);

  useNotificationHandler({
    type: "AI_PROGRESS",
    handler: (payload) => {
      setGenerationStep(payload.data?.step || "");
    },
  });

  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        setChildrenState("loading");
        const childrenList = await getChildren();
        setChildren(childrenList.data || []);
        if (childrenList.data?.length > 0) {
          setSelectedChild(childrenList.data[0].id);
        }
        setChildrenState("ready");
      } catch (error) {
        console.log(error);
        setChildrenState("error");
      }
    };

    void load();
  }, [user]);

  useEffect(() => {
    if (!showAiEditor || !generatedStory?.story?.id) return;

    const loadMessages = async () => {
      try {
        setEditorMessagesLoading(true);
        const response = await getStoryEditMessages(generatedStory.story.id);
        setChatMessages(
          response.map((message: { role: "user" | "assistant"; content: string }) => ({
            role: message.role,
            text: message.content,
          })),
        );
      } catch (error) {
        console.log(error);
        setFeedback({
          tone: "error",
          title: t("aiStoryEditor"),
          message: "Couldn't load the editing history. You can still send a new instruction.",
        });
      } finally {
        setEditorMessagesLoading(false);
      }
    };

    void loadMessages();
  }, [generatedStory, showAiEditor, t]);

  useEffect(() => {
    if (generatedStory?.story?.isApproved || generatedStory?.story?.status === "PUBLISHED") {
      setStoryApproved(true);
    }
  }, [generatedStory]);

  const handleChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleGenerate = async () => {
    if (loading || generatedStory) return;
    if (!selectedChild || !form.behavior.trim() || !form.length || !form.type) {
      setFeedback({
        tone: "error",
        title: t("storyGeneratorTitle"),
        message: "Choose a child and complete the story details before generating.",
      });
      return;
    }

    try {
      setGenerationStep(t("storyGeneratorStarting"));
      setLoading(true);
      setFeedback({
        tone: "loading",
        title: t("storyGeneratorTitle"),
        message: "Creating the story now. You can keep reading the progress here while the AI works.",
      });
      const response = await generateStory({
        educationalGoal: form.behavior,
        storyType: form.type,
        storyLength: form.length,
        withImages: form.withImage,
        withAudio: form.withAudio,
        childId: selectedChild,
      });
      setGeneratedStory(response.data);
      setIsEditing(false);
      setFeedback({
        tone: "success",
        title: "Story ready",
        message: "The story has been generated. Review the scenes, then approve or refine them below.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Story generation failed",
        message: "The story could not be generated this time. Check the details and try again.",
      });
    } finally {
      setGenerationStep("");
      setLoading(false);
      setQuestionLoading(false);
    }
  };

  const handleEditWithAi = async () => {
    if (!aiMessage.trim() || !generatedStory) return;

    try {
      setAiLoading(true);
      setFeedback({
        tone: "loading",
        title: t("aiStoryEditor"),
        message: "Applying your editing request and preparing an updated version of the story.",
      });
      setChatMessages((prev) => [...prev, { role: "user", text: aiMessage }]);

      const response = await updateStoryWithAi(generatedStory.story.id, {
        editRequest: aiMessage,
      });

      setGeneratedStory(response.data);
      setStoryApproved(response.data.story.isApproved);
      setQuestions([]);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.data.summaryOfChanges || t("storyEditorUpdated"),
        },
      ]);
      setAiMessage("");
      setFeedback({
        tone: "success",
        title: "Story updated",
        message: response.data.summaryOfChanges || t("storyEditorUpdated"),
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "AI edit failed",
        message: "The AI could not update the story right now. Try a simpler instruction or send it again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!generatedStory) return;

    try {
      setSavingEdit(true);
      setFeedback({
        tone: "loading",
        title: "Saving edits",
        message: "Updating the story scenes and syncing your changes.",
      });
      const response = await updateStory(generatedStory.story.id, {
        educationalGoal: form.behavior,
        storyType: form.type,
        storyLength: form.length,
        withImages: form.withImage,
        withAudio: form.withAudio,
        scenes: generatedStory.scenes.map((scene) => ({
          id: scene.id,
          title: scene.title,
          content: scene.content,
        })),
      });

      setGeneratedStory(response.data);
      setStoryApproved(response.data.story.isApproved);
      setQuestions([]);
      setIsEditing(false);
      setShowSuccessAlert(true);

      window.setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      setFeedback({
        tone: "success",
        title: "Changes saved",
        message: "Your manual edits were saved successfully.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Couldn't save edits",
        message: "The story changes were not saved. Try again to keep your updates.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleApprove = async () => {
    if (!generatedStory) return;

    try {
      setApprovingStory(true);
      setFeedback({
        tone: "loading",
        title: "Approving story",
        message: "Publishing the story so question generation can continue.",
      });
      await approveStory(generatedStory.story.id);
      setFeedback({
        tone: "success",
        title: "Story approved",
        message: "The story is approved. You can generate the child questions next.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Approval failed",
        message: "The story was not approved. Please try again.",
      });
      return;
    } finally {
      setApprovingStory(false);
    }

    const approvedStories = JSON.parse(localStorage.getItem("stories") || "[]") as unknown[];
    approvedStories.push({
      ...generatedStory,
      status: "approved",
    });
    localStorage.setItem("stories", JSON.stringify(approvedStories));
    setStoryApproved(true);
  };

  const handleGenerateQuestions = async () => {
    if (!generatedStory || questions.length > 0) return;

    try {
      setQuestionLoading(true);
      setFeedback({
        tone: "loading",
        title: "Generating questions",
        message: "Creating reflection questions for this story. This can take a few seconds.",
      });
      const response = await generateQuestions(generatedStory.story.id);
      setQuestions(response.data);
      setFeedback({
        tone: "success",
        title: "Questions ready",
        message: "The generated questions are ready for review and editing.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Question generation failed",
        message: "Questions could not be generated. Try again when you’re ready.",
      });
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!generatedStory || !newQuestion.trim()) return;

    try {
      setAddingQuestion(true);
      const response = await addQuestions(generatedStory.story.id, { question: newQuestion });
      setQuestions((prev) => [...prev, response.data]);
      setNewQuestion("");
      setShowAddQuestion(false);
      setFeedback({
        tone: "success",
        title: "Question added",
        message: "The new question is now part of the review list.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Couldn't add question",
        message: "The new question was not saved. Try adding it again.",
      });
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      setDeletingQuestionId(questionId);
      await deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
      setFeedback({
        tone: "success",
        title: "Question removed",
        message: "The question has been removed from this story.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Couldn't remove question",
        message: "The question is still here because the delete request failed.",
      });
    } finally {
      setDeletingQuestionId(null);
    }
  };

  const handleUpdateQuestion = async (questionId: number) => {
    try {
      setUpdatingQuestionId(questionId);
      const response = await updateQuestion(questionId, { question: editedQuestion });
      setQuestions((prev) =>
        prev.map((question) => (question.id === questionId ? response.data : question)),
      );
      setEditingQuestionId(null);
      setEditedQuestion("");
      setFeedback({
        tone: "success",
        title: "Question updated",
        message: "Your edits to the question were saved.",
      });
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Couldn't update question",
        message: "The edited question was not saved. Please try again.",
      });
    } finally {
      setUpdatingQuestionId(null);
    }
  };

  const handleApproveQuestions = async () => {
    if (!generatedStory) return;

    try {
      setApprovingQuestions(true);
      setFeedback({
        tone: "loading",
        title: "Approving questions",
        message: "Finalizing the questions and opening the child story library next.",
      });
      const response = await approveQuestions(generatedStory.story.id);
      const childId = response.data?.childId ?? generatedStory.story.childId;

      if (!childId) {
        throw new Error("Missing child id after question approval");
      }

      navigate(`/my-stories/${childId}`);
    } catch (error) {
      console.log(error);
      setFeedback({
        tone: "error",
        title: "Couldn't approve questions",
        message: "The questions are still in review because approval did not finish.",
      });
    } finally {
      setApprovingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-card backdrop-blur-sm">
          <div className="mb-6 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t("storyGeneratorBadge")}
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("storyGeneratorTitle")}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              {t("storyGeneratorIntro")}
            </p>
          </div>

          <div className="space-y-5">
            {feedback ? (
              <AsyncFeedback
                tone={feedback.tone}
                title={feedback.title}
                message={feedback.message}
              />
            ) : null}

            {childrenState === "loading" ? (
              <AsyncFeedback
                tone="loading"
                title={t("Loading children")}
                message={t("Getting child profiles so the story can be created for the right reader")}
              />
            ) : null}

            {childrenState === "error" ? (
              <AsyncFeedback
                tone="error"
                title={t("Couldn't load children")}
                message={t("The child list did not load. Refresh the page and try again.")}
              />
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">{t("chooseChild")}</label>
                <Select
                  disabled={loading || childrenState !== "ready"}
                  value={selectedChild ? String(selectedChild) : ""}
                  onValueChange={(value) => setSelectedChild(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectChild")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {children.map((child) => (
                        <SelectItem key={child.id} value={String(child.id)}>
                          {child.firstName}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">{t("storyLength")}</label>
                <select
                  disabled={loading}
                  name="length"
                  value={form.length}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background p-3 text-foreground"
                >
                  <option value="">{t("selectLength")}</option>
                  <option value="short">{t("short")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="long">{t("long")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">{t("educationalGoal")}</label>
              <textarea
                disabled={loading}
                name="behavior"
                value={form.behavior}
                onChange={handleChange}
                placeholder={t("behaviorPlaceholder")}
                className="min-h-[140px] w-full rounded-2xl border border-input bg-background p-4 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">{t("storyType")}</label>
                <select
                  disabled={loading}
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background p-3 text-foreground"
                >
                  <option value="">{t("selectType")}</option>
                  <option value="adventure">{t("adventure")}</option>
                  <option value="fantasy">{t("fantasy")}</option>
                  <option value="educational">{t("educational")}</option>
                  <option value="funny">{t("funny")}</option>
                </select>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">{t("storyGeneratorExtrasTitle")}</p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-foreground">
                  <label className="inline-flex items-center gap-2">
                    <input
                      disabled={loading}
                      type="checkbox"
                      name="withImage"
                      checked={form.withImage}
                      onChange={handleChange}
                    />
                    {t("withImages")}
                  </label>

                  <label className="inline-flex items-center gap-2">
                    <input
                      disabled={loading}
                      type="checkbox"
                      name="withAudio"
                      checked={form.withAudio}
                      onChange={handleChange}
                    />
                    {t("withAudio")}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("storyGeneratorReadyTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {t("storyGeneratorReadyDescription")}
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || generatedStory !== null}
                className="sm:min-w-[180px]"
                loading={loading}
                loadingText={t("storyGeneratorGenerating")}
              >
                {generatedStory
                  ? t("storyGeneratorAlreadyGenerated")
                  : t("generateStory")}
              </Button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                {generationStep || t("storyGeneratorGenerating")}
              </div>
            ) : null}
          </div>
        </section>

        {generatedStory ? (
          <section className="mt-8 rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-card backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-bold">{generatedStory.story.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {generatedStory.story.content}
                </p>
              </div>

              <div className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {storyApproved ? t("storyStatusApproved") : t("storyStatusDraft")}
              </div>
            </div>

            {generatedStory.story.audioUrl ? (
              <audio controls className="mt-5 w-full">
                <source src={resolveAssetUrl(generatedStory.story.audioUrl)} type="audio/mpeg" />
              </audio>
            ) : null}

            <div className="mt-6 space-y-5">
              {generatedStory.scenes.map((scene, index) => (
                <div key={scene.id} className="rounded-[1.75rem] border border-border/60 bg-muted/20 p-5">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {t("storySceneLabelShort", { number: index + 1 })}
                    </p>
                    <h3 className="text-xl font-bold">{scene.title}</h3>
                  </div>

                  {scene.imageUrl ? (
                    <img
                      src={resolveAssetUrl(scene.imageUrl)}
                      alt={scene.title}
                      className="mb-4 w-full rounded-2xl"
                    />
                  ) : null}

                  <textarea
                    value={scene.content}
                    readOnly={!isEditing}
                    onChange={(event) => {
                      if (!generatedStory) return;

                      const updatedScenes = generatedStory.scenes.map((candidate) =>
                        candidate.id === scene.id
                          ? { ...candidate, content: event.target.value }
                          : candidate,
                      );

                      setGeneratedStory({
                        ...generatedStory,
                        scenes: updatedScenes,
                      });
                    }}
                    className={`min-h-[140px] w-full rounded-2xl border border-input p-4 text-foreground ${
                      isEditing ? "bg-background" : "bg-muted/40"
                    }`}
                  />
                </div>
              ))}
            </div>

            {showSuccessAlert ? (
              <Alert className="mt-6 max-w-md">
                <CheckCircle2Icon className="h-4 w-4" />
                <AlertTitle>{t("success")}</AlertTitle>
                <AlertDescription>{t("storyUpdatedSuccess")}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <Button loading={savingEdit} onClick={handleSaveEdit} loadingText={t("saving")}>
                    {t("saveEdit")}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={savingEdit}>
                    {t("cancel")}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setIsEditing(true)} disabled={approvingStory || questionLoading}>
                    {t("editStory")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAiEditor(true)} disabled={approvingStory || questionLoading}>
                    <Wand2 className="h-4 w-4" />
                    {t("editUsingAI")}
                  </Button>

                  {!storyApproved ? (
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-600/90"
                      loading={approvingStory}
                    >
                      {t("approveStory")}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleGenerateQuestions}
                      disabled={questionLoading || questions.length > 0}
                      loading={questionLoading}
                      loadingText={t("storyGeneratingQuestions")}
                    >
                      {questions.length > 0
                        ? t("storyQuestionsAlreadyGenerated")
                        : t("storyGenerateQuestions")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>
        ) : null}

        {questions.length > 0 ? (
          <section className="mt-8 rounded-[2rem] border border-border/50 bg-card/90 p-6 shadow-card backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">{t("storyQuestionsTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("storyQuestionsReviewDescription")}
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  {editingQuestionId === question.id ? (
                    <>
                      <input
                        value={editedQuestion}
                        onChange={(event) => setEditedQuestion(event.target.value)}
                        className="w-full rounded-xl border border-input bg-background p-3 text-foreground"
                        disabled={updatingQuestionId === question.id}
                      />
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateQuestion(question.id)}
                          loading={updatingQuestionId === question.id}
                        >
                          {t("save")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingQuestionId(null)}
                          disabled={updatingQuestionId === question.id}
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <p className="text-sm leading-6 text-foreground">{question.question}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => {
                            setEditingQuestionId(question.id);
                            setEditedQuestion(question.question);
                          }}
                          disabled={deletingQuestionId === question.id}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteQuestion(question.id)}
                          loading={deletingQuestionId === question.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
            {showAddQuestion ? (
              <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <input
                  value={newQuestion}
                  onChange={(event) => setNewQuestion(event.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-3 text-foreground"
                  placeholder={t("storyNewQuestionPlaceholder")}
                  disabled={addingQuestion}
                />
                <div className="mt-3 flex gap-2">
                  <Button onClick={handleAddQuestion} loading={addingQuestion}>
                    {t("save")}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddQuestion(false)} disabled={addingQuestion}>
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button className="mt-6" onClick={() => setShowAddQuestion(true)}>
                {t("storyAddQuestion")}
              </Button>
            )}

            <Button
              className="mt-6 bg-green-600 hover:bg-green-600/90"
              onClick={handleApproveQuestions}
              loading={approvingQuestions}
            >
              {t("storyApproveQuestions")}
            </Button>
            </div>
          </section>
        ) : null}
      </div>

      {showAiEditor ? (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card text-card-foreground shadow-2xl">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <h2 className="text-xl font-bold">{t("aiStoryEditor")}</h2>
              <p className="text-xs text-muted-foreground">{t("storyEditorDescription")}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAiEditor(false)}
              className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground"
            >
              {t("close")}
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {editorMessagesLoading ? (
              <AsyncFeedback
                tone="loading"
                title={t("Loading AI editor")}
                message={t("Fetching the previous editing conversation for this story.")}
              />
            ) : null}

            {!editorMessagesLoading && chatMessages.length === 0 ? (
              <AsyncFeedback
                tone="info"
                title={t("No editing history yet")}
                message={t("Send the first instruction and the AI editor will start keeping the conversation here.")}
              />
            ) : null}

            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl p-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {message.text}
              </div>
            ))}

            {aiLoading ? (
              <div className="w-fit rounded-2xl bg-muted p-3 text-sm text-foreground">
                {t("updatingStory")}
              </div>
            ) : null}
          </div>

          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <input
                value={aiMessage}
                onChange={(event) => setAiMessage(event.target.value)}
                placeholder={t("askAiToModifyStory")}
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleEditWithAi();
                  }
                }}
              />

              <Button
                onClick={handleEditWithAi}
                disabled={aiLoading || !aiMessage.trim()}
                loading={aiLoading}
              >
                {t("send")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
