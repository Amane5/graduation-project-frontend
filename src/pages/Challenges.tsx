import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Trophy,
  Calendar,
  Users,
  FileQuestion,
  Search,
  Loader2,
  AlertCircle,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

import PlayfulBackground from "@/components/PlayfulBackground";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

import {
  getChallenges,
  deleteChallenge,
} from "@/lib/challenge";
import { formatDateTime } from "@/lib/date";

interface Challenge {
  id: number;
  title: string;
  description?: string;

  startAt: string;
  endAt: string;

  participants: any[];
  questions: any[];
}

const Challenges = () => {
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState(false);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(false);

      const res = await getChallenges();

      console.log("CHALLENGES", res);

      setChallenges(res.data || []);
    } catch (err) {
      console.log(err);

      setError(true);

      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleDelete = async (
    challengeId: number
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this challenge?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(challengeId);

      await deleteChallenge(challengeId);

      setChallenges((prev) =>
        prev.filter(
          (challenge) =>
            challenge.id !== challengeId
        )
      );

      toast.success(
        "Challenge deleted successfully"
      );
    } catch (err) {
      console.log(err);

      toast.error("Failed to delete challenge");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredChallenges =
    challenges.filter((challenge) =>
      challenge.title
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-background relative">
      <div
        className="absolute inset-0 playful-bg opacity-60"
        aria-hidden
      />

      <PlayfulBackground />

      <div className="relative z-10">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}

          <div className="mb-6 animate-fade-slide-up">
            <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3">
              Challenges
              <Trophy className="w-8 h-8 text-yellow-500" />
            </h1>

            <p className="text-muted-foreground mt-2">
              Create educational challenges
              and track your children's
              progress.
            </p>
          </div>

          {/* Search */}

          <div className="bg-card rounded-2xl shadow-soft border border-border/50 p-4 mb-6 animate-fade-slide-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

              <Input
                placeholder="Search challenges..."
                className="pl-10"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {/* Loading */}

          {loading && (
            <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />

              <p className="text-muted-foreground text-sm">
                Loading challenges...
              </p>
            </div>
          )}

          {/* Error */}

          {!loading && error && (
            <div className="bg-card rounded-2xl p-10 text-center border border-destructive/30">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>

              <h3 className="font-bold text-lg">
                Failed to load challenges
              </h3>

              <Button
                variant="outline"
                className="mt-4"
                onClick={loadChallenges}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            filteredChallenges.length === 0 && (
              <div className="bg-card rounded-3xl p-12 text-center border border-border/50 shadow-soft animate-scale-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-primary-foreground" />
                </div>

                <h3 className="text-xl font-bold mb-2">
                  No Challenges Found
                </h3>

                <p className="text-muted-foreground">
                  Create your first challenge
                  to start learning.
                </p>
              </div>
            )}

          {/* Challenges Grid */}

          {!loading &&
            !error &&
            filteredChallenges.length > 0 && (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredChallenges.map(
                  (challenge, index) => (
                    <div
                      key={challenge.id}
                      className="bg-card rounded-3xl border border-border/50 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300 p-5 animate-fade-slide-up opacity-0"
                      style={{
                        animationDelay: `${index * 80}ms`,
                        animationFillMode:
                          "forwards",
                      }}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center">
                          <Trophy className="w-7 h-7 text-primary-foreground" />
                        </div>
                      </div>

                      <h2 className="font-bold text-xl mb-2 line-clamp-2">
                        {challenge.title}
                      </h2>

                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {challenge.description ||
                          "No description provided"}
                      </p>

                      <div className="space-y-3 mb-5">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-primary" />

                          <span>
                            {
                              challenge
                                .participants
                                ?.length
                            }{" "}
                            Participants
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <FileQuestion className="w-4 h-4 text-primary" />

                          <span>
                            {
                              challenge
                                .questions?.length
                            }{" "}
                            Questions
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-primary" />

                          <span>
                            Start: {" "}
                            {formatDateTime(
                              challenge.startAt
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
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

                      

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            navigate(
                              `/challenge/${challenge.id}`
                            )
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/challenge/${challenge.id}/edit`
                            )
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                          disabled={
                            deletingId ===
                            challenge.id
                          }
                          onClick={() =>
                            handleDelete(
                              challenge.id
                            )
                          }
                        >
                          {deletingId ===
                          challenge.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

          {/* Floating Create Button */}

          <Link to="/challenges/create">
            <Button
              size="icon"
              className="
                fixed
                bottom-8
                right-8
                h-16
                w-16
                rounded-full
                shadow-xl
                z-50
              "
            >
              <Plus className="w-7 h-7" />
            </Button>
          </Link>
        </main>
      </div>
    </div>
  );
};

export default Challenges;