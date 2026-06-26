import { useNavigate, useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import {
  Calendar,
  Trophy,
  Users,
  FileQuestion,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";

import PlayfulBackground from "@/components/PlayfulBackground";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import {
  getChallenge,
  getWinner,
} from "@/lib/challenge";
import { formatDateTime } from "@/lib/date";

const ChallengeDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { data: challengeRes, isLoading } =
    useQuery({
      queryKey: ["challenge", id],
      queryFn: () =>
        getChallenge(Number(id)),
    });

  const { data: winnerRes } =
    useQuery({
      queryKey: ["winner", id],
      queryFn: () =>
        getWinner(Number(id)),
    });

  const challenge =
    challengeRes?.data;

  const winner =
    winnerRes?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen">
        Challenge not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}

          <Card className="mb-6 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">
                    {challenge.title}
                  </h1>

                  <p className="text-muted-foreground mt-2">
                    {
                      challenge.description
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/challenge/${id}/edit`
                      )
                    }
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    variant="destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />

                  <span>
                    Start:
                    {" "}
                    {formatDateTime(
                      challenge.startAt
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-red-500" />

                  <span>
                    End:
                    {" "}
                    {formatDateTime(
                      challenge.endAt
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winner */}

          {winner && (
            <Card className="mb-6 border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Winner
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <p className="font-medium">
                    Score:
                    {" "}
                    {winner.score}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {winner.winners?.map(
                      (child: any) => (
                        <Badge
                          key={child.id}
                          className="text-sm"
                        >
                          {child.firstName}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Participants */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {challenge.participants.map(
                  (participant: any) => (
                    <div
                      key={
                        participant.childId
                      }
                      className="
                        flex
                        items-center
                        justify-between
                        border
                        rounded-lg
                        p-3
                      "
                    >
                      <div>
                        <p className="font-medium">
                          {
                            participant.child
                              ?.firstName
                          }
                        </p>

                        <p className="text-sm text-muted-foreground">
                          Score:
                          {" "}
                          {
                            participant.totalScore
                          }
                        </p>
                      </div>

                      <Badge
                        variant={
                          participant.completedAt
                            ? "default"
                            : "secondary"
                        }
                      >
                        {participant.completedAt
                          ? "Completed"
                          : "Pending"}
                      </Badge>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Questions */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileQuestion className="w-5 h-5" />
                  Questions
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {challenge.questions.map(
                  (
                    question: any,
                    index: number
                  ) => (
                    <Card
                      key={question.id}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <h3 className="font-semibold">
                            Question{" "}
                            {index + 1}
                          </h3>

                          <p>
                            {
                              question.question
                            }
                          </p>

                          <div className="text-sm text-muted-foreground">
                            Expected Answer:
                          </div>

                          <div className="bg-muted p-3 rounded-lg">
                            {
                              question.expectedAnswer
                            }
                          </div>

                          <div className="flex justify-between items-center">
                            <Badge>
                              {
                                question.points
                              }{" "}
                              Points
                            </Badge>

                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChallengeDetails;