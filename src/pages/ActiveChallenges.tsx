import { useNavigate } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

import { getMyActiveChallenges } from "@/lib/challenge";

import PlayfulBackground from "@/components/PlayfulBackground";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import {
  Trophy,
  Calendar,
  PlayCircle,
  BookOpen,
} from "lucide-react";
import { formatDateTime } from "@/lib/date";

const ActiveChallenges = () => {
  const navigate = useNavigate();

  const { data, isLoading } =
    useQuery({
      queryKey: ["activeChallenges"],
      queryFn:
        getMyActiveChallenges,
    });

  const challenges = data?.data || [];
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
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              My Challenges
            </h1>

            <p className="text-muted-foreground mt-2">
              Complete challenges and earn points
            </p>
          </div>

          {challenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />

                <h3 className="text-xl font-semibold">
                  No Active Challenges
                </h3>

                <p className="text-muted-foreground mt-2">
                  You don't have any active challenges right now.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {challenges.map(
                (challenge: any) => {
                    const isCompleted = challenge.participants?.[0]?.completedAt;
                    return (
<Card
                    key={challenge.id}
                    className="hover:shadow-lg transition-all"
                  >
                    <CardHeader>
                      <CardTitle>
                        {challenge.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {
                          challenge.description
                        }
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />

                          <span>
                            {
                              challenge
                                .questions
                                ?.length
                            }{" "}
                            Questions
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />

                          <span>
                            Start:{" "}
                            {formatDateTime(
                              challenge.startAt
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />

                          <span>
                            End:{" "}
                            {formatDateTime(
                              challenge.endAt
                            )}
                          </span>
                        </div>
                      </div>

                      {isCompleted ? (
  <Button
    className="w-full"
    variant="secondary"
    onClick={() =>
      navigate(`/challenge/${challenge.id}/results`)
    }
  >
    <Trophy className="w-4 h-4 mr-2" />
    View Results
  </Button>
) : (
  <Button
    className="w-full"
    onClick={() =>
      navigate(`/challenge/${challenge.id}/play`)
    }
  >
    <PlayCircle className="w-4 h-4 mr-2" />
    Start Challenge
  </Button>
)}
                    </CardContent>
                  </Card>
                    )
                  
}
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActiveChallenges;