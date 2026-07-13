import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Users, Calendar, Sparkles, Trash2 } from "lucide-react";

import PlayfulBackground from "@/components/PlayfulBackground";

import { toast } from "sonner";

import { getChildren } from "@/lib/children";
import {
  createEmptyChallengeQuestion,
  ensureChallengeQuestionSlot,
  extractRecommendedAnswer,
  isRecommendedChallengeQuestion,
  mergeGeneratedChallengeQuestions,
  type ChallengeQuestionDraft,
} from "@/lib/challengeQuestionDrafts";

import { AsyncFeedback } from "@/components/ui/async-feedback";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  getChallenge,
  recommendAnswer,
  recommendQuestions,
  updateChallenge,
} from "@/lib/challenge";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

const formSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters"),

    description: z
      .string()
      .min(5, "Description is required"),

    startAt: z.string(),

    endAt: z.string(),
    // participantIds: z.array(z.number())
  })
  .refine(
    (data) =>
      new Date(data.endAt) >
      new Date(data.startAt),
    {
      message:
        "End date must be after start date",
      path: ["endAt"],
    }
  );

type FormValues = z.infer<
  typeof formSchema
>;

interface Child {
  id: number;
  firstName: string;
  lastName: string;
}

interface ChallengeParticipantRecord {
  id: number;
}

interface ChallengeQuestionRecord {
  question: string;
  expectedAnswer: string;
  points: number;
}

interface ChallengeDetailsRecord {
  title: string;
  description?: string | null;
  startAt: string;
  endAt: string;
  participants: ChallengeParticipantRecord[];
  questions: ChallengeQuestionRecord[];
}

interface QuestionFeedbackState {
  tone: "loading" | "success" | "error";
  title: string;
  message: string;
  retryMode?: "question" | "answer";
}

const shiftIndexedStateAfterRemoval = <T,>(
  state: Record<number, T | undefined>,
  removedIndex: number,
) =>
  Object.entries(state).reduce<
    Record<number, T | undefined>
  >((nextState, [indexKey, value]) => {
    const index = Number(indexKey);

    if (
      Number.isNaN(index) ||
      index === removedIndex ||
      value === undefined
    ) {
      return nextState;
    }

    nextState[
      index > removedIndex
        ? index - 1
        : index
    ] = value;

    return nextState;
  }, {});

const toDateTimeLocal = (
  dateString: string
) => {
  const date = new Date(dateString);

  const pad = (n: number) =>
    String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(
    date.getDate()
  )}T${pad(
    date.getHours()
  )}:${pad(
    date.getMinutes()
  )}`;
};

const EditChallenge = () => {
  const navigate = useNavigate();
    const { id } = useParams();
    const { t } = useTranslation();


    const {
    data: challengeRes,
    isLoading,
    } = useQuery({
    queryKey: ["challenge", id],
    queryFn: () =>
        getChallenge(Number(id)),
    });

    const challenge =
    challengeRes?.data as
      | ChallengeDetailsRecord
      | undefined;
  const [children, setChildren] =
    useState<Child[]>([]);

  const [
    participantIds,
    setParticipantIds,
  ] = useState<number[]>([]);

  const [loading, setLoading] =
    useState(false);
  const [
    isGeneratingQuestion,
    setIsGeneratingQuestion,
  ] = useState(false);
  const [
    questionGenerationAnchor,
    setQuestionGenerationAnchor,
  ] = useState<number | null>(null);
  const [
    answerLoadingByIndex,
    setAnswerLoadingByIndex,
  ] = useState<Record<number, boolean>>(
    {}
  );
  const [
    questionFeedbackByIndex,
    setQuestionFeedbackByIndex,
  ] = useState<
    Record<
      number,
      QuestionFeedbackState | undefined
    >
  >({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      // participantIds: [],
    },
  });

  const [questions, setQuestions] = useState([
    createEmptyChallengeQuestion(),
  ] satisfies ChallengeQuestionDraft[]);

  const setQuestionFeedback = (
    index: number,
    feedback?: QuestionFeedbackState
  ) => {
    setQuestionFeedbackByIndex(
      (prev) => {
        const next = {
          ...prev,
        };

        if (!feedback) {
          delete next[index];
          return next;
        }

        next[index] = feedback;
        return next;
      }
    );
  };

useEffect(() => {
  console.log(form.formState.errors);
}, [form.formState.errors]);

useEffect(() => {
  if (!challenge) return;

  form.reset({
    title: challenge.title,
    description:
      challenge.description || "",
    startAt: toDateTimeLocal(
      challenge.startAt
    ),
    endAt: toDateTimeLocal(
      challenge.endAt
    ),
  });

  setParticipantIds(
    challenge.participants.map(
      (participant) =>
        participant.id
    )
  );
console.log(challenge.participants);
  setQuestions(
    challenge.questions.map(
      (challengeQuestion) => ({
        question: challengeQuestion.question,
        expectedAnswer:
          challengeQuestion.expectedAnswer,
        points: challengeQuestion.points,
      })
    )
  );
}, [challenge, form]);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const res =
          await getChildren();

        setChildren(
          res?.data || []
        );
      } catch (error) {
        console.log(error);

        toast.error(
          "Failed to load children"
        );
      }
    };

    loadChildren();
  }, []);

  const addQuestion = () => {
  setQuestions((prev) => [
    ...prev,
    createEmptyChallengeQuestion(),
  ]);
    };

    const removeQuestion = (index: number) => {
    if (questions.length === 1) {
        toast.error(
        "Challenge must contain at least one question"
        );
        return;
    }

    setQuestions((prev) =>
        prev.filter((_, i) => i !== index)
    );
    setQuestionFeedbackByIndex((prev) =>
      shiftIndexedStateAfterRemoval(
        prev,
        index
      )
    );
    setAnswerLoadingByIndex((prev) =>
      shiftIndexedStateAfterRemoval(
        prev,
        index
      )
    );
    };

    const updateQuestion = (
  index: number,
  field: keyof ChallengeQuestionDraft,
  value: string | number
    ) => {
    const updated = [...questions];

    updated[index] = {
        ...updated[index],
        [field]: value,
    };

    setQuestions(updated);
    setQuestionFeedback(index);
    };

    const handleGenerateQuestions = async () => {
    if (participantIds.length === 0) {
      toast.error(
        "Select participants first"
      );
      return;
    }

    const {
      questions: preparedQuestions,
      anchorIndex,
    } = ensureChallengeQuestionSlot(
      questions
    );

    if (preparedQuestions !== questions) {
      setQuestions(preparedQuestions);
    }

    setIsGeneratingQuestion(true);
    setQuestionGenerationAnchor(
      anchorIndex
    );
    setQuestionFeedback(anchorIndex, {
      tone: "loading",
      title: "Generating question",
      message:
        "AI is drafting a question for this slot.",
    });

    try {
      const res =
        await recommendQuestions(
          participantIds
        );

      const generatedQuestions = Array.isArray(
        res?.data
      )
        ? res.data.filter(
            isRecommendedChallengeQuestion
          )
        : [];

      if (!generatedQuestions.length) {
        setQuestionFeedback(
          anchorIndex,
          {
            tone: "error",
            title:
              "Couldn't generate question",
            message:
              "No AI question was returned for the selected participants. Try again.",
            retryMode: "question",
          }
        );
        return;
      }

      setQuestions((prev) =>
        mergeGeneratedChallengeQuestions(
          prev,
          generatedQuestions
        )
      );

      setQuestionFeedback(anchorIndex, {
        tone: "success",
        title:
          generatedQuestions.length === 1
            ? "Question ready"
            : "Questions ready",
        message:
          generatedQuestions.length === 1
            ? "The AI question was added to this challenge."
            : `${generatedQuestions.length} AI questions were added to this challenge.`,
      });
    } catch (error) {
      console.log(error);

      setQuestionFeedback(anchorIndex, {
        tone: "error",
        title:
          "Couldn't generate question",
        message:
          "The AI couldn't draft a question right now. Try again.",
        retryMode: "question",
      });
    } finally {
      setIsGeneratingQuestion(false);
      setQuestionGenerationAnchor(
        null
      );
    }
  };

  const handleGenerateAnswer =
  async (
    question: string,
    index: number
  ) => {
    if (!question.trim()) {
      setQuestionFeedback(index, {
        tone: "error",
        title: "Question needed first",
        message:
          "Add the question text before asking AI for an answer.",
      });
      return;
    }

    setAnswerLoadingByIndex((prev) => ({
      ...prev,
      [index]: true,
    }));
    setQuestionFeedback(index, {
      tone: "loading",
      title: "Generating answer",
      message:
        "AI is drafting the expected answer for this question.",
    });

    try {
      const res =
        await recommendAnswer(
          question
        );

      const answer =
        extractRecommendedAnswer(
          res?.data
        );

      if (!answer) {
        setQuestionFeedback(index, {
          tone: "error",
          title:
            "Couldn't generate answer",
          message:
            "The AI didn't return an answer this time. Try again.",
          retryMode: "answer",
        });
        return;
      }

      setQuestions((prev) =>
        prev.map(
          (
            currentQuestion,
            currentIndex
          ) =>
            currentIndex === index
              ? {
                  ...currentQuestion,
                  expectedAnswer:
                    answer,
                }
              : currentQuestion
        )
      );

      setQuestionFeedback(index, {
        tone: "success",
        title: "Answer ready",
        message:
          "The expected answer was filled in for this question.",
      });
    } catch (error) {
      console.log(error);

      setQuestionFeedback(index, {
        tone: "error",
        title:
          "Couldn't generate answer",
        message:
          "The AI couldn't draft an answer right now. Try again.",
        retryMode: "answer",
      });
    } finally {
      setAnswerLoadingByIndex(
        (prev) => {
          const next = {
            ...prev,
          };
          delete next[index];
          return next;
        }
      );
    }
  };


  const onSubmit = async (
  values: FormValues
) => {
      console.log("ON SUBMIT FIRED");

  if (participantIds.length === 0) {
    toast.error(
      "Please select at least one participant"
    );
    return;
  }

  if (questions.length === 0) {
    toast.error(
      "Add at least one question"
    );
    return;
  }

  const invalidQuestion =
    questions.find(
      (q) =>
        !q.question ||
        !q.expectedAnswer ||
        q.points < 1
    );

  if (invalidQuestion) {
    toast.error(
      "Please complete all questions"
    );
    return;
  }

  try {
    setLoading(true);

    const payload = {
      ...values,

      participantIds,

      questions,
    };
console.log(payload);
console.log(participantIds);
    const res = await updateChallenge(Number(id), payload)

    toast.success(
      "Challenge updated successfully"
    );
console.log(res);
    navigate(
      `/challenge/${res.data.id}`
    );
  } catch (error) {
    console.log(error);

    toast.error(
      "Failed to create challenge"
    );
  } finally {
    setLoading(false);
  }
};

const now = new Date();

const isActive = challenge &&
  now >= new Date(challenge.startAt) &&
  now <= new Date(challenge.endAt);
const isFinished = challenge &&
  now > new Date(challenge.endAt);

const cannotEdit = isActive || isFinished;
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      Loading...
    </div>
  );
}
  return (
    <div className="min-h-screen bg-background relative">
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {t("EditChallenge")}
            </h1>
            {
            cannotEdit && (
                <Card className="border-red-500">
                <CardContent className="py-4">
                    <p className="text-red-500 font-medium">
                    {isActive
                    ? t("cannotEditActiveChallenge")
                    : t("cannotEditFinishedChallenge")
                    }
                    </p>
                </CardContent>
                </Card>
            )
            }
            <p className="text-muted-foreground mt-2">
              {t("updateChallengeDescription")}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>
                    {t("ChallengeInformation")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <FormField
                  disabled={cannotEdit}
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("ChallengeTitle")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            placeholder={t("ChallengeTitlePlaceholder")}
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("ChallengeDescription")}
                        </FormLabel>

                        <FormControl>
                          <Textarea
                          disabled={cannotEdit}
                            placeholder={t("ChallengeDescriptionPlaceholder")}
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {t("Participants")}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {children.map(
                      (child) => (
                        <label
                          key={child.id}
                          className={`
                            border
                            rounded-xl
                            p-4
                            cursor-pointer
                            transition-all
                            ${
                              participantIds.includes(
                                child.id
                              )
                                ? "border-primary bg-primary/5"
                                : ""
                            }
                          `}
                        >
                          <div className="flex items-center justify-between" >
                            <div>
                              <p className="font-medium">
                                {
                                  child.firstName
                                }
                              </p>

                              <p className="text-sm text-muted-foreground">
                                {
                                  child.lastName
                                }
                              </p>
                            </div>

                            <input
                            disabled={cannotEdit}
                              type="checkbox"
                              checked={participantIds.includes(
                                child.id
                              )}
                              onChange={(
                                e
                              ) => {
                                if (
                                  e.target
                                    .checked
                                ) {
                                  setParticipantIds(
                                    (
                                      prev
                                    ) => [
                                      ...prev,
                                      child.id,
                                    ]
                                  );
                                } else {
                                  setParticipantIds(
                                    (
                                      prev
                                    ) =>
                                      prev.filter(
                                        (
                                          id
                                        ) =>
                                          id !==
                                          child.id
                                      )
                                  );
                                }
                              }}
                            />
                          </div>
                        </label>
                      )
                    )}
                  </div>

                  {participantIds.length >
                    0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {children
                        .filter(
                          (
                            child
                          ) =>
                            participantIds.includes(
                              child.id
                            )
                        )
                        .map(
                          (
                            child
                          ) => (
                            <Badge
                              key={
                                child.id
                              }
                            >
                              {
                                child.firstName
                              }
                            </Badge>
                          )
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {t("Schedule")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="grid md:grid-cols-2 gap-5">
                  <FormField
                    disabled={cannotEdit}
                    control={form.control}
                    name="startAt"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          {t("StartDate")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    disabled={cannotEdit}
                    control={form.control}
                    name="endAt"
                    render={({
                      field,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          {t("EndDate")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                    <div className="flex items-center justify-between">
                    <CardTitle>
                        {t("Questions")}
                    </CardTitle>

                    <div className="flex gap-2">
                        <Button
                        disabled={cannotEdit}
                        type="button"
                        variant="outline"
                        loading={
                          isGeneratingQuestion
                        }
                        onClick={
                            handleGenerateQuestions
                        }
                        >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("AIQuestions")}
                        </Button>

                        <Button
                        type="button"
                        disabled={
                          cannotEdit ||
                          isGeneratingQuestion
                        }
                        onClick={addQuestion}
                        >
                        {t("AddQuestion")}
                        </Button>
                    </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {questions.map(
                    (question, index) => {
                        const feedback =
                          questionFeedbackByIndex[
                            index
                          ];
                        const isAnswerLoading =
                          answerLoadingByIndex[
                            index
                          ] === true;
                        const isQuestionLoading =
                          isGeneratingQuestion &&
                          questionGenerationAnchor ===
                            index;
                        const isQuestionBusy =
                          isAnswerLoading ||
                          isQuestionLoading;

                        return (
                        <Card
                        key={index}
                        className="border"
                        >
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center">
                            <h3 className="font-semibold">
                                {t("Question")} {index + 1}
                            </h3>

                            <Button
                                disabled={
                                  cannotEdit ||
                                  isGeneratingQuestion
                                }
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                removeQuestion(
                                    index
                                )
                                }
                            >
                                <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                            </div>

                            <Input
                            disabled={
                              cannotEdit ||
                              isQuestionLoading
                            }
                            placeholder="Question"
                            value={
                                question.question
                            }
                            onChange={(e) =>
                                updateQuestion(
                                index,
                                "question",
                                e.target.value
                                )
                            }
                            />

                            <Textarea
                            disabled={
                              cannotEdit ||
                              isAnswerLoading
                            }
                            placeholder="Expected Answer"
                            value={
                                question.expectedAnswer
                            }
                            onChange={(e) =>
                                updateQuestion(
                                index,
                                "expectedAnswer",
                                e.target.value
                                )
                            }
                            />

                            <Input
                            disabled={
                              cannotEdit ||
                              isQuestionBusy
                            }
                            type="number"
                            min={1}
                            value={
                                question.points
                            }
                            onChange={(e) =>
                                updateQuestion(
                                index,
                                "points",
                                Number(
                                    e.target.value
                                )
                                )
                            }
                            />

                            {feedback ? (
                              <AsyncFeedback
                                tone={
                                  feedback.tone
                                }
                                title={
                                  feedback.title
                                }
                                message={
                                  feedback.message
                                }
                                actionLabel={
                                  feedback.tone ===
                                    "error" &&
                                  feedback.retryMode
                                    ? t("tryAgain")
                                    : undefined
                                }
                                onAction={
                                  feedback.tone ===
                                    "error" &&
                                  feedback.retryMode ===
                                    "question"
                                    ? () => {
                                        void handleGenerateQuestions();
                                      }
                                    : feedback.tone ===
                                          "error" &&
                                        feedback.retryMode ===
                                          "answer"
                                      ? () => {
                                          void handleGenerateAnswer(
                                            question.question,
                                            index
                                          );
                                        }
                                      : undefined
                                }
                                actionLoading={
                                  feedback.retryMode ===
                                  "question"
                                    ? isGeneratingQuestion
                                    : isAnswerLoading
                                }
                              />
                            ) : null}

                            <Button
                            disabled={
                              cannotEdit ||
                              isQuestionLoading
                            }
                            type="button"
                            variant="secondary"
                            loading={
                              isAnswerLoading
                            }
                            onClick={() =>
                                handleGenerateAnswer(
                                question.question,
                                index
                                )
                            }
                            >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {t("AIAnswer")}
                            </Button>
                        </CardContent>
                        </Card>
                        );
                      }
                    )}
                </CardContent>
              </Card> 

              <div className="flex justify-end">
                    <Button
                        type="submit"
                        size="lg"
                        disabled={loading || cannotEdit}
                    >
                        {loading
                        ? t("Saving...")
                        : t("SaveChanges")
                        }
                    </Button>
               </div>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
};

export default EditChallenge;
