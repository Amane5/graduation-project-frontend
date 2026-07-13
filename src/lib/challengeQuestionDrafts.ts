export interface ChallengeQuestionDraft {
  question: string;
  expectedAnswer: string;
  points: number;
}

export interface RecommendedChallengeQuestion {
  question: string;
}

export const createEmptyChallengeQuestion = (): ChallengeQuestionDraft => ({
  question: "",
  expectedAnswer: "",
  points: 1,
});

export const isChallengeQuestionSlotEmpty = (
  question: ChallengeQuestionDraft,
) =>
  question.question.trim().length === 0 &&
  question.expectedAnswer.trim().length === 0;

export const ensureChallengeQuestionSlot = (
  questions: ChallengeQuestionDraft[],
) => {
  const reusableIndex = questions.findIndex(
    isChallengeQuestionSlotEmpty,
  );

  if (reusableIndex !== -1) {
    return {
      questions,
      anchorIndex: reusableIndex,
    };
  }

  return {
    questions: [
      ...questions,
      createEmptyChallengeQuestion(),
    ],
    anchorIndex: questions.length,
  };
};

export const mergeGeneratedChallengeQuestions = (
  questions: ChallengeQuestionDraft[],
  generatedQuestions: RecommendedChallengeQuestion[],
) => {
  const nextQuestions = [...questions];
  let searchStartIndex = 0;

  generatedQuestions.forEach((generatedQuestion) => {
    const reusableIndex = nextQuestions.findIndex(
      (question, index) =>
        index >= searchStartIndex &&
        isChallengeQuestionSlotEmpty(question),
    );

    if (reusableIndex === -1) {
      nextQuestions.push({
        question: generatedQuestion.question,
        expectedAnswer: "",
        points: 5,
      });
      searchStartIndex = nextQuestions.length;
      return;
    }

    nextQuestions[reusableIndex] = {
      question: generatedQuestion.question,
      expectedAnswer: "",
      points: 5,
    };
    searchStartIndex = reusableIndex + 1;
  });

  return nextQuestions;
};

export const isRecommendedChallengeQuestion = (
  value: unknown,
): value is RecommendedChallengeQuestion => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as { question?: unknown };
  return (
    typeof candidate.question === "string" &&
    candidate.question.trim().length > 0
  );
};

export const extractRecommendedAnswer = (
  value: unknown,
) => {
  if (typeof value !== "object" || value === null) {
    return "";
  }

  const candidate = value as {
    expectedAnswer?: unknown;
    answer?: unknown;
  };

  if (
    typeof candidate.expectedAnswer ===
      "string" &&
    candidate.expectedAnswer.trim().length > 0
  ) {
    return candidate.expectedAnswer.trim();
  }

  if (
    typeof candidate.answer === "string" &&
    candidate.answer.trim().length > 0
  ) {
    return candidate.answer.trim();
  }

  return "";
};
