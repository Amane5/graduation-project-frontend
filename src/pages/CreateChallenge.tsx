import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  createChallenge,
  recommendAnswer,
  recommendQuestions,
} from "@/lib/challenge";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

const getCurrentValidationDate = () => {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
};

const parseDateTimeValue = (
  value: string
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const formSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters"),

    description: z
      .string()
      .min(5, "Description is required"),

    startAt: z
      .string()
      .min(1, "Start date is required"),

    endAt: z
      .string()
      .min(1, "End date is required"),
  })
  .superRefine((data, ctx) => {
    const now = getCurrentValidationDate();
    const startAt = data.startAt
      ? parseDateTimeValue(data.startAt)
      : null;
    const endAt = data.endAt
      ? parseDateTimeValue(data.endAt)
      : null;

    if (startAt && startAt < now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Start date cannot be in the past",
        path: ["startAt"],
      });
    }

    if (endAt && endAt < now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "End date cannot be in the past",
        path: ["endAt"],
      });
    }

    if (
      startAt &&
      endAt &&
      endAt <= startAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "End date must be after start date",
        path: ["endAt"],
      });
    }
  });

type FormValues = z.infer<
  typeof formSchema
>;

interface Child {
  id: number;
  firstName: string;
  lastName: string;
}

interface QuestionFeedbackState {
  tone: "loading" | "success" | "error";
  title: string;
  message: string;
  retryMode?: "question" | "answer";
}

interface QuestionFieldErrors {
  question?: string;
  expectedAnswer?: string;
  points?: string;
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

const validateQuestionDraft = (
  question: ChallengeQuestionDraft
) => {
  const errors: QuestionFieldErrors = {};

  if (!question.question.trim()) {
    errors.question =
      "Question text is required";
  }

  if (
    !question.expectedAnswer.trim()
  ) {
    errors.expectedAnswer =
      "Expected answer is required";
  }

  if (
    !Number.isFinite(question.points) ||
    question.points <= 0
  ) {
    errors.points =
      "Points must be greater than 0";
  }

  return errors;
};

const hasQuestionFieldErrors = (
  errors: QuestionFieldErrors
) =>
  Boolean(
    errors.question ||
      errors.expectedAnswer ||
      errors.points
  );

const CreateChallenge = () => {
  const navigate = useNavigate();
  const {t} = useTranslation()
  const [children, setChildren] = useState<Child[]>([]);

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
  const [
    questionErrorsByIndex,
    setQuestionErrorsByIndex,
  ] = useState<
    Record<
      number,
      QuestionFieldErrors | undefined
    >
  >({});
  const [
    questionSectionError,
    setQuestionSectionError,
  ] = useState<string | null>(null);
  const [
    showQuestionValidation,
    setShowQuestionValidation,
  ] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",

    defaultValues: {
      title: "",
      description: "",
      startAt: "",
      endAt: "",
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

  const setQuestionValidationError = (
    index: number,
    errors?: QuestionFieldErrors
  ) => {
    setQuestionErrorsByIndex(
      (prev) => {
        const next = {
          ...prev,
        };

        if (
          !errors ||
          !hasQuestionFieldErrors(errors)
        ) {
          delete next[index];
          return next;
        }

        next[index] = errors;
        return next;
      }
    );
  };

  const syncQuestionValidationState = (
    questionList: ChallengeQuestionDraft[],
    showErrors = true
  ) => {
    const nextErrors: Record<
      number,
      QuestionFieldErrors
    > = {};

    questionList.forEach(
      (question, index) => {
        const errors =
          validateQuestionDraft(question);

        if (
          hasQuestionFieldErrors(errors)
        ) {
          nextErrors[index] = errors;
        }
      }
    );

    if (showErrors) {
      setQuestionErrorsByIndex(nextErrors);
      setQuestionSectionError(
        Object.keys(nextErrors).length > 0
          ? "At least one valid question is required, and every question must be complete."
          : null
      );
    } else {
      setQuestionErrorsByIndex({});
      setQuestionSectionError(null);
    }

    return Object.keys(nextErrors).length === 0;
  };

  const validateAllQuestions = (
    questionList: ChallengeQuestionDraft[]
  ) => {
    setShowQuestionValidation(true);
    return syncQuestionValidationState(
      questionList,
      true
    );
  };

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

    setQuestions((prev) => {
      const nextQuestions = prev.filter(
        (_, i) => i !== index
      );

      if (showQuestionValidation) {
        syncQuestionValidationState(
          nextQuestions,
          true
        );
      }

      return nextQuestions;
    });
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
    if (showQuestionValidation) {
      syncQuestionValidationState(
        updated,
        true
      );
    } else {
      setQuestionValidationError(index);
    }
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

      setQuestions((prev) => {
        const nextQuestions =
          mergeGeneratedChallengeQuestions(
            prev,
            generatedQuestions
          );

        syncQuestionValidationState(
          nextQuestions,
          showQuestionValidation
        );

        return nextQuestions;
      }
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
      const res = await recommendAnswer(question);
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

      setQuestions((prev) => {
        const nextQuestions = prev.map(
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
        );

        syncQuestionValidationState(
          nextQuestions,
          showQuestionValidation
        );

        return nextQuestions;
      }
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
  const formIsValid =
    await form.trigger();

  const questionsAreValid =
    validateAllQuestions(questions);

  if (!formIsValid || !questionsAreValid) {
    return;
  }

  if (participantIds.length === 0) {
    toast.error(
      "Please select at least one participant"
    );
    return;
  }

  if (questions.length === 0) {
    setQuestionSectionError(
      "At least one valid question is required."
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

    const res =
      await createChallenge(payload);

    toast.success(
      "Challenge created successfully"
    );

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
  return (
    <div className="min-h-screen bg-background relative">
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {t("Create Challenge")}
            </h1>

            <p className="text-muted-foreground mt-2">
              {t("Create a fun educational challenge for your children.")}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>
                    {t("Challenge Information")}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("ChallengeTitle")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            placeholder={t("Space Challenge")}
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
                            placeholder={t("Challenge description...")}
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
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {
                                  child.firstName
                                }
                              </p>
                            </div>

                            <input
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
                    control={form.control}
                    name="startAt"
                    render={({
                      field,
                      fieldState,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          {t("StartDate")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="datetime-local"
                            aria-invalid={
                              fieldState.invalid
                            }
                            className={cn(
                              fieldState.invalid
                                ? "border-destructive focus-visible:border-destructive"
                                : undefined
                            )}
                            {...field}
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endAt"
                    render={({
                      field,
                      fieldState,
                    }) => (
                      <FormItem>
                        <FormLabel>
                          {t("EndDate")}
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="datetime-local"
                            aria-invalid={
                              fieldState.invalid
                            }
                            className={cn(
                              fieldState.invalid
                                ? "border-destructive focus-visible:border-destructive"
                                : undefined
                            )}
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
                    {questionSectionError ? (
                      <p className="text-sm font-medium text-destructive">
                        {questionSectionError}
                      </p>
                    ) : null}
                    {questions.map(
                    (question, index) => {
                        const feedback =
                          questionFeedbackByIndex[
                            index
                          ];
                        const questionErrors =
                          questionErrorsByIndex[
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
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={
                                  isGeneratingQuestion
                                }
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
                              isQuestionLoading
                            }
                            aria-invalid={
                              Boolean(
                                questionErrors?.question
                              )
                            }
                            className={cn(
                              questionErrors?.question
                                ? "border-destructive focus-visible:border-destructive"
                                : undefined
                            )}
                            placeholder={t("Question")}
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
                            {questionErrors?.question ? (
                              <p className="text-sm text-destructive">
                                {
                                  questionErrors.question
                                }
                              </p>
                            ) : null}

                            <Textarea
                            disabled={
                              isAnswerLoading
                            }
                            aria-invalid={
                              Boolean(
                                questionErrors?.expectedAnswer
                              )
                            }
                            className={cn(
                              questionErrors?.expectedAnswer
                                ? "border-destructive focus-visible:ring-destructive"
                                : undefined
                            )}
                            placeholder={t("ExpectedAnswer")}
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
                            {questionErrors?.expectedAnswer ? (
                              <p className="text-sm text-destructive">
                                {
                                  questionErrors.expectedAnswer
                                }
                              </p>
                            ) : null}

                            <Input
                            disabled={
                              isQuestionBusy
                            }
                            aria-invalid={
                              Boolean(
                                questionErrors?.points
                              )
                            }
                            className={cn(
                              questionErrors?.points
                                ? "border-destructive focus-visible:border-destructive"
                                : undefined
                            )}
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
                            {questionErrors?.points ? (
                              <p className="text-sm text-destructive">
                                {
                                  questionErrors.points
                                }
                              </p>
                            ) : null}

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
                            type="button"
                            variant="secondary"
                            loading={
                              isAnswerLoading
                            }
                            disabled={
                              isQuestionLoading
                            }
                            onClick={() =>{
                              handleGenerateAnswer(
                                question.question,
                                index
                                )
                            }
                                
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
                        disabled={loading}
                    >
                        {loading
                        ? t("Creating...")
                        : t("Create Challenge")}
                    </Button>
               </div>
            </form>
          </Form>
        </main>
      </div>
    </div>
  );
};

export default CreateChallenge;
