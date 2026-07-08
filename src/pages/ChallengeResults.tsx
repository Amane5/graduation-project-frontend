import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Confetti from "react-confetti";

import {
  Trophy,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";

import PlayfulBackground from "@/components/PlayfulBackground";


import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMyResults } from "@/lib/challenge";
import { useTranslation } from "react-i18next";

const ChallengeResults = () => {
  const navigate = useNavigate();

  const {t} = useTranslation();

  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["challenge-results", id],

    queryFn: () =>
      getMyResults(Number(id)),
    });

  const result = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        No Results Found
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background relative">
      <PlayfulBackground />

      {result.status !== "pending" && result.isWinner && <Confetti />}

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
      {result.status === "pending" && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950/40">
          <CardContent className="py-6 text-center">
            <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">
              ⏳ {t("Challenge Still Running")}
            </h2>

            <p className="mt-2 text-yellow-700 dark:text-yellow-200">
              {t("You have completed the challenge successfully.")}
              <br />
              {t("Final results will be available after all participants finish.")}
            </p>
          </CardContent>
        </Card>
      )}
        <Card className="mb-8 shadow-soft">
          <CardContent className="py-10 text-center">

            {result.status !== "pending" && result.isWinner ? (
              <>
                <Trophy className="w-20 h-20 mx-auto text-yellow-500 mb-4" />

                <h1 className="text-4xl font-bold mb-3">
                  🎉 {t("Congratulations")}!
                </h1>

                <p className="text-lg text-muted-foreground">
                  {t("You are one of the winners!")}
                </p>
              </>
            ) : result.status !== "pending" ?(
              <>
                <Star className="w-20 h-20 mx-auto text-primary mb-4" />

                <h1 className="text-4xl font-bold mb-3">
                  ⭐ {t("Great Effort")}!
                </h1>

                <p className="text-lg text-muted-foreground">
                  {t("You completed the challenge.")}
                </p>
              </>
            ) : (
              <>
              <Star className="w-20 h-20 mx-auto text-primary mb-4" />

              <h1 className="text-4xl font-bold mb-3">
                ✅ {t("Challenge Completed")}
              </h1>

              <p className="text-lg text-muted-foreground">
                {t("Your answers have been submitted successfully.")}
              </p>
            </>
            )}

            <div className="mt-6 text-2xl font-bold">
              {t("Score")}: {result.totalScore}
            </div>

            {result.status !== "pending" && !result.isWinner &&
              result.winners?.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold">
                    {t("Winners")}
                  </p>

                  <p className="text-muted-foreground">
                    {result.winners
                      .map(
                        (winner: any) =>
                          winner.firstName
                      )
                      .join(", ")}
                  </p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>
             {t("Answers Review")}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {result.answers.map(
              (answer: any) => (
                <Card
                  key={answer.id}
                  className="border"
                >
                  <CardContent className="pt-6">

                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-semibold">
                        {
                          answer.question
                            .question
                        }
                      </h3>

                      {answer.isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>
                          {t("Your Answer")}:
                        </strong>{" "}
                        {answer.answer}
                      </p>

                      <p>
                        <strong>
                          {t("ExpectedAnswer")}:
                        </strong>{" "}
                        {
                          answer.question
                            .expectedAnswer
                        }
                      </p>

                      <p>
                        <strong>
                          {t("Points")}:
                        </strong>{" "}
                        {answer.earnedPoints}
                        /
                        {
                          answer.question
                            .points
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </CardContent>
        </Card>

        <div className="flex justify-center mt-8">
          <Button
            size="lg"
            onClick={() =>
              navigate("/my-challenges")
            }
          >
            {t("Back to Challenges")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeResults;