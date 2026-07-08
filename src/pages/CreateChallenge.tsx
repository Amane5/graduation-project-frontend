import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Users, Calendar, Sparkles, Trash2 } from "lucide-react";

import PlayfulBackground from "@/components/PlayfulBackground";

import { toast } from "sonner";

import { getChildren } from "@/lib/children";

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),

    defaultValues: {
      title: "",
      description: "",
      startAt: "",
      endAt: "",
    },
  });

  const [questions, setQuestions] = useState([
  {
    question: "",
    expectedAnswer: "",
    points: 1,
  },
]);

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
    {
      question: "",
      expectedAnswer: "",
      points: 1,
    },
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
    };

    const updateQuestion = (
  index: number,
  field: string,
  value: string | number
    ) => {
    const updated = [...questions];

    updated[index] = {
        ...updated[index],
        [field]: value,
    };

    setQuestions(updated);
    };

    const handleGenerateQuestions = async () => {
    if (participantIds.length === 0) {
      toast.error(
        "Select participants first"
      );
      return;
    }

    try {
      const res =
        await recommendQuestions(
          participantIds
        );

      if (!res?.data?.length) {
        toast.error(
          "No recommendations found"
        );
        return;
      }

      const generated =
        res.data.map((item: any) => ({
          question: item.question,
          expectedAnswer: "",
          points: 5,
        }));

    //   setQuestions(generated);
    setQuestions((prev) => [
    ...prev,
    ...generated,
    ]);

      toast.success(
        "Questions generated successfully"
      );
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to generate questions"
      );
    }
  };

  const handleGenerateAnswer =
  async (
    question: string,
    index: number
  ) => {
    if (!question.trim()) {
      toast.error("Write question first");
      return;
    }

    try {
      const res = await recommendAnswer(question);
console.log(res);
console.log(res.data);
console.log(res.data.expectedAnswer);
      const answer = res?.data?.expectedAnswer ??
  res?.data?.answer;

      if (!answer) return;

      console.log("Before:", questions[index]);
console.log("Answer:", answer);
      const updated = [...questions];

      updated[index].expectedAnswer =
        answer;
console.log("After:", updated[index]);

      setQuestions(updated);

      toast.success(
        "Answer generated"
      );
      console.log(res);
console.log(res.data);
console.log(res.data.expectedAnswer);
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to generate answer"
      );
    }
  };

  const onSubmit = async (
  values: FormValues
) => {
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

                              <p className="text-sm text-muted-foreground">
                                {
                                  child.lastName
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
                        type="button"
                        variant="outline"
                        onClick={
                            handleGenerateQuestions
                        }
                        >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {t("AIQuestions")}
                        </Button>

                        <Button
                        type="button"
                        onClick={addQuestion}
                        >
                        {t("AddQuestion")}
                        </Button>
                    </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {questions.map(
                    (question, index) => (
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

                            <Textarea
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

                            <Input
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

                            <Button
                            type="button"
                            variant="secondary"
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
                    )
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