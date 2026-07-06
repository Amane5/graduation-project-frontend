
import { useEffect, useState } from "react";
// import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChildren } from "@/lib/children";
import { useAuth } from "@/contexts/AuthContext";
import {
  approveStory,
  generateStory,
  getStoryEditMessages,
  updateStory,
  updateStoryWithAi,
} from "@/lib/story";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addQuestions, approveQuestions, deleteQuestion, generateQuestions, updateQuestion } from "@/lib/questions";
import { Edit2, Trash2 } from "lucide-react";
import { useNotificationHandler } from "@/hooks/useFirebaseNotifications";
import { CheckCircle2Icon } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function StoryForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    behavior: "",
    length: "",
    type: "",
    withImage: false,
    withAudio: false,
  });
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [generatedStory, setGeneratedStory] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showAiEditor, setShowAiEditor] = useState(false);

  const [aiMessage, setAiMessage] = useState("");

  const [chatMessages, setChatMessages] = useState<any[]>([]);

  const [aiLoading, setAiLoading] = useState(false);

  const [storyApproved, setStoryApproved] = useState(false);

  const [questions, setQuestions] = useState<any[]>([]);

  const [showAddQuestion, setShowAddQuestion] = useState(false);

  const [newQuestion, setNewQuestion] = useState("");

  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);

  const [editedQuestion, setEditedQuestion] = useState("");

  const [questionLoading, setQuestionLoading] = useState(false);
  const [generationStep , setGenerationStep] = useState("")

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useNotificationHandler({
    type: "AI_PROGRESS",
    handler: (payload) => {
      setGenerationStep(payload.data?.step || "");
    },
  });

  //useeffect to get children's names
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      try {
        const childrenList = await getChildren();
        setChildren(childrenList.data || []);
        console.log("CHILDREN:", childrenList.data);
        if (childrenList.data?.length > 0) {
          setSelectedChild(childrenList.data[0].id);
        }
      } catch (e) {
        console.log(e);
      }
    };

    load();
  }, [user]);

  useEffect(() => {
    if (!showAiEditor || !generatedStory?.story?.id) return;

    const loadMessages = async () => {
      try {
        const res = await getStoryEditMessages(generatedStory.story.id);

        const formatted = res.map((msg: any) => ({
          role: msg.role,
          text: msg.content,
        }));

        setChatMessages(formatted);
      } catch (err) {
        console.log(err);
      }
    };

    loadMessages();
  }, [showAiEditor, generatedStory]);

  useEffect(() => {
  if (
    generatedStory?.story?.isApproved ||
    generatedStory?.story?.status === "PUBLISHED"
  ) {
    setStoryApproved(true);
  }
}, [generatedStory]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleGenerate = async () => {
    if(loading || generatedStory) return
    try {
      setGenerationStep("Starting...");
      setLoading(true);
      const response = await generateStory({
        educationalGoal: form.behavior,
        storyType: form.type,
        storyLength: form.length,
        withImages: form.withImage,
        withAudio: form.withAudio,
        childId: selectedChild,
      });
      console.log(response);
      setGeneratedStory(response.data);
      setIsEditing(false);
      
    } catch (err) {
      console.log(err);
    } finally {
      setGenerationStep("");
      setLoading(false);
      setQuestionLoading(false);
    }
  };

  const handleStoryChange = (e) => {
    setGeneratedStory({
      ...generatedStory,
      content: e.target.value,
    });
  };

  const handleEditWithAi = async () => {
    if (!aiMessage.trim()) return;

    try {
      setAiLoading(true);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          text: aiMessage,
        },
      ]);
      console.log("SENDING:", {
        editRequest: aiMessage,
      });
      const res = await updateStoryWithAi(generatedStory.story.id, {
        editRequest: aiMessage,
      });
      console.log("OLD STORY", generatedStory);
      console.log("NEW RESPONSE", res.data);

      // update story on screen
      setGeneratedStory(res.data);
      setStoryApproved( res.data.story.isApproved);
      setQuestions([]);

      // add assistant message
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.data.summaryOfChanges || "Story updated successfully",
        },
      ]);

      setAiMessage("");
    } catch (err) {
      console.log(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const res = await updateStory(generatedStory.story.id, {
        educationalGoal: form.behavior,
        storyType: form.type,
        storyLength: form.length,
        withImages: form.withImage,
        withAudio: form.withAudio,
        scenes: generatedStory.scenes.map((s: any) => ({
          id: s.id,
          title: s.title,
          content: s.content,
        })),
      });

      setGeneratedStory(res.data);
      setStoryApproved( res.data.story.isApproved);
      setQuestions([]);
      setIsEditing(false);

      setShowSuccessAlert(true);

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.log(err);
    }
  };

  const handleApprove = async () => {
    try {
      await approveStory(generatedStory.story.id);
      console.log("approve", generatedStory);
    } catch (err) {
      console.log(err);
    }

    const approvedStories = JSON.parse(localStorage.getItem("stories")) || [];

    approvedStories.push({
      ...generatedStory,
      status: "approved",
    });

    localStorage.setItem("stories", JSON.stringify(approvedStories));
    setStoryApproved(true);
  };

  const handleGenerateQuestions = async () =>{
    if(questions.length > 0) return
    try{
      setQuestionLoading(true);
      const res = await generateQuestions(generatedStory.story.id)
      setQuestions(res.data)
    }catch(err){
      console.log(err)
    }finally {
    setQuestionLoading(false);
  }
  }

  const handleAddQuestion = async ()=> {
    if(!newQuestion.trim()) return
    try{
      const res = await addQuestions(generatedStory.story.id, {question:newQuestion})
      setQuestions((prev) => [...prev , res.data])
      setNewQuestion("")
      setShowAddQuestion(false)
    }catch(err){
      console.log(err)
    }
  }

  const handleDeleteQuestion = async (questionId:number) => {
    try{
      const res = await deleteQuestion(questionId)
      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
    }catch(err){
      console.log(err)
    }
  }

  const handleUpdateQuestion = async (questionId:number) =>{
    try{
      const res = await updateQuestion(questionId, {question: editedQuestion})
      setQuestions((prev) => prev.map((q) => q.id === questionId? res.data : q))
      setEditingQuestionId(null)
      setEditedQuestion("")
    }catch(err){
      console.log(err)
    }
  }

  const handleApproveQuestions = async () => {
    try{
      const res = await approveQuestions(generatedStory.story.id)
      navigate(
      `/my-stories/${generatedStory.story.childId}`
      );
    }catch(err){
      console.log(err)
    }
  }
  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-md">
        <h1 className="text-3xl font-bold mb-6">{t("storyGeneratorTitle")}</h1>
        <div
          className={`space-y-4 ${
            loading ? "opacity-60 pointer-events-none" : ""
          }`}
        >
        {/* FORM */}
        <div className="space-y-4">
          {/* CHILD SELECT */}
          <div>
            <label className="block mb-2 font-semibold">
              {t("chooseChild")}
            </label>

            <Select
              disabled={loading}
              value={selectedChild ? String(selectedChild) : ""}
              onValueChange={(value) => setSelectedChild(Number(value))}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder={t("selectChild")} />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {children.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* EDUCATIONAL GOAL */}
          <div>
            <label className="block mb-2 font-semibold">
              {t("educationalGoal")}
            </label>

            <textarea
              disabled={loading}
              name="behavior"
              value={form.behavior}
              onChange={handleChange}
              placeholder={t("behaviorPlaceholder")}
               className="w-full min-h-[120px] rounded-xl border border-input bg-background p-3 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* LENGTH */}
          <div>
            <label className="block mb-2 font-semibold">
              {t("storyLength")}
            </label>

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

          {/* TYPE */}
          <div>
            <label className="block mb-2 font-semibold">{t("storyType")}</label>

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

          {/* CHECKBOXES */}
          <div className="flex gap-6 text-foreground">
            <label className="flex items-center gap-2">
              <input
                disabled={loading}
                type="checkbox"
                name="withImage"
                checked={form.withImage}
                onChange={handleChange}
              />
              {t("withImages")}
            </label>

            <label className="flex items-center gap-2">
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

          {/* BUTTON */}
          <button
            onClick={handleGenerate}
            disabled={loading || generatedStory !== null}
            className="
            bg-purple-600
            text-white
            px-6
            py-3
            rounded-xl
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          >
            {loading ? t("generating...") : generatedStory ? "Story Already Generated" : t("generateStory")}
          </button>
          {loading && (
            <div className="mt-4 font-medium text-primary">
              {generationStep}
            </div>
          )}
        </div>
      </div>
        {/* GENERATED STORY */}
        {generatedStory && (
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6">
            {/* TITLE */}
            <h2 className="text-3xl font-bold mb-4">
              {generatedStory.story.title}
            </h2>

            {/* SUMMARY */}
            <p className="mb-6 text-muted-foreground">{generatedStory.story.content}</p>

            {/* AUDIO */}
            {generatedStory.story.audioUrl && (
              <audio controls className="w-full mb-6">
                <source
                  src={`http://localhost:3000${generatedStory.story.audioUrl}`}
                  type="audio/mpeg"
                />
              </audio>
            )}

            {/* SCENES */}
            {generatedStory.scenes.map((scene: any) => (
              <div key={scene.id} className="mb-10">
                <h3 className="text-xl font-bold mb-3">{scene.title}</h3>

                {/* IMAGE */}
                {scene.imageUrl && (
                  <img
                    src={`http://localhost:3000${scene.imageUrl}`}
                    alt={scene.title}
                    className="w-full rounded-xl mb-4"
                  />
                )}

                {/* CONTENT */}
                <textarea
                  value={scene.content}
                  readOnly={!isEditing}
                  onChange={(e) => {
                    const updatedScenes = generatedStory.scenes.map((s: any) =>
                      s.id === scene.id ? { ...s, content: e.target.value } : s,
                    );

                    setGeneratedStory({
                      ...generatedStory,
                      scenes: updatedScenes,
                    });
                  }}
                  className={`w-full min-h-[120px] rounded-xl border border-input p-3 text-foreground ${
                    isEditing ? "bg-background" : "bg-muted/40"
                  }`}
                  />

                </div>

              )
            )}
            
            {isEditing &&  (
              <div className="flex gap-4">
                <button
                  onClick={handleSaveEdit}
                  className="bg-yellow-500 text-white px-5 py-2 rounded-xl"
                >
                  {t("saveEdit")}
                </button>

                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-5 py-2 rounded-xl"
                >
                  {t("cancel")}
                </button>
              </div>
            )}

            {showSuccessAlert && (
              <Alert className="max-w-md mb-4">
                <CheckCircle2Icon className="h-4 w-4" />

                <AlertTitle>Success</AlertTitle>

                <AlertDescription>
                  Story updated successfully.
                </AlertDescription>
              </Alert>
            )}
            {!isEditing && (
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl">
                  {t("editStory")}
                </button>

                <button
                  onClick={() => setShowAiEditor(true)}
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl"
                >
                  {t("editUsingAI")}
                </button>

                {!storyApproved ? (
                  <button
                  onClick={handleApprove}
                  className="bg-green-600 text-white px-5 py-2 rounded-xl"
                  >
                    {t("approveStory")}
                  </button> 
                ):(
                  <button
                    disabled={questionLoading || questions.length > 0}
                    onClick={handleGenerateQuestions}
                    className="
                    bg-purple-600
                    text-white
                    px-6
                    py-3
                    rounded-xl
                    disabled:opacity-50
                    disabled:cursor-not-allowed"
                  >
                    {questionLoading
                  ? "Generating..." : questions.length > 0 ? "Questions Already Generated" : "Generate Questions"}
                  </button>
                
                )}
              </div>
            )}
          </div>
        )}

        {questions.length > 0 && (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-2xl font-bold mb-6">
            Story Questions
          </h2>

          {questions.map((question) => (
            <div
              key={question.id}
              className="mb-4 rounded-xl border border-border bg-muted/20 p-4"
            >
              {editingQuestionId === question.id ? (
                <>
                  <input
                    value={editedQuestion}
                    onChange={(e) =>
                      setEditedQuestion(e.target.value)
                    }
                    className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                  />

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        handleUpdateQuestion(
                          question.id
                        )
                      }
                    >
                      Save
                    </button>

                    <button
                      onClick={() =>
                        setEditingQuestionId(null)
                      }
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>{question.question}</p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => {
                        setEditingQuestionId(
                          question.id
                        );
                        setEditedQuestion(
                          question.question
                        );
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteQuestion(
                          question.id
                        )
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

    {showAddQuestion ? (
      <div className="mt-4">
        <input
          value={newQuestion}
          onChange={(e) =>
            setNewQuestion(e.target.value)
          }
          className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
        />

        <div className="flex gap-2 mt-2">
          <button onClick={handleAddQuestion}>
            Save
          </button>

          <button
            onClick={() =>
              setShowAddQuestion(false)
            }
          >
            Cancel
          </button>
        </div>
      </div>
    ) : (
      
      <button
        onClick={() =>
          setShowAddQuestion(true)
        }
        className="bg-green-600 text-white px-5 py-2 rounded-xl mt-6"
      >
        Add Question
      </button>
    )}

    <button
      onClick={handleApproveQuestions}
      className="bg-green-600 text-white px-5 py-2 rounded-xl mt-6"
    >
      Approve Questions
    </button>
  </div>
        )}
      </div>
      {showAiEditor && (
        <div className="fixed top-0 right-0 z-50 flex h-screen w-[400px] flex-col border-l border-border bg-card text-card-foreground shadow-2xl">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-xl font-bold">{t("aiStoryEditor")}</h2>

            <button
              onClick={() => setShowAiEditor(false)}
              className="text-muted-foreground"
            >
              ✕
            </button>
          </div>

          {/* CHAT */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-xl max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white ml-auto"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {aiLoading && (
              <div className="w-fit rounded-xl bg-muted p-3 text-foreground">
                {t("updatingStory")}
              </div>
            )}
          </div>

          {/* INPUT */}
          <div className="flex gap-2 border-t border-border p-4">
            <input
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder={t("askAiToModifyStory")}
              className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground"
            />

            <button
              onClick={handleEditWithAi}
              disabled={aiLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-xl"
            >
              {t("send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
