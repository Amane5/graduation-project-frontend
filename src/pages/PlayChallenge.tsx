import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import {
  getChallengeForPlay,
  submitAnswer,
  finishChallenge,
} from "@/lib/challenge";

import { toast } from "sonner";

import PlayfulBackground from "@/components/PlayfulBackground";

import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";

import { Progress } from "@/components/ui/progress";

import {
  ArrowLeft,
  ArrowRight,
  Trophy,
} from "lucide-react";

const PlayChallenge = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState(0);

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [submitting, setSubmitting] =useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["playChallenge", id],
    queryFn: () =>
      getChallengeForPlay(Number(id)),
  });

  const challenge = data?.data;
    const participant = challenge?.participants?.[0];

    useEffect(() => {
    if (participant?.completedAt) {
        toast.error("You already completed this challenge");
        navigate(`/challenge/${id}/results`);
    }
    }, [participant]);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const questions =
    challenge?.questions || [];

  const question =
    questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      questions.length) *
    100;

  const handleAnswerChange = (
    value: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [question.id]: value,
    }));
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);

      for (const q of questions) {
        const answer =
          answers[q.id] || "";

        await submitAnswer(
          q.id,
          answer
        );
      }

      await finishChallenge(
        Number(id)
      );

      toast.success(
        "Challenge completed successfully!"
      );

      navigate(`/challenge/${id}/results`);
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to submit challenge"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              {challenge.title}
            </h1>

            <p className="text-muted-foreground mt-2">
              {challenge.description}
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>
                  Question{" "}
                  {currentQuestion + 1}
                </span>

                <span>
                  {questions.length}
                </span>
              </div>

              <Progress
                value={progress}
              />
            </CardContent>
          </Card>

          <motion.div
            key={question.id}
            initial={{
              opacity: 0,
              x: 50,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {question.question}
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  {question.points} points
                </p>
              </CardHeader>

              <CardContent>
                <Textarea
                  rows={5}
                  placeholder="Write your answer..."
                  value={
                    answers[
                      question.id
                    ] || ""
                  }
                  onChange={(e) =>
                    handleAnswerChange(
                      e.target.value
                    )
                  }
                />
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              disabled={
                currentQuestion === 0
              }
              onClick={() =>
                setCurrentQuestion(
                  (prev) => prev - 1
                )
              }
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestion <
            questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestion(
                    (prev) => prev + 1
                  )
                }
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={
                  handleFinish
                }
                disabled={
                  submitting
                }
              >
                <Trophy className="w-4 h-4 mr-2" />

                {submitting
                  ? "Submitting..."
                  : "Finish Challenge"}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlayChallenge;