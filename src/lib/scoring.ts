export interface AttemptScoreSummary {
  earnedPoints: number;
  maxPoints: number;
  finalScore: number;
  hasUngradedEssays: boolean;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
}

export function calculateAttemptScore(
  questions: Array<{
    id: string;
    type: string;
    points: number;
    options: Array<{ id: string; isCorrect: boolean }>;
  }>,
  answers: Array<{
    questionId: string;
    selectedOptionId?: string | null;
    answerText?: string | null;
    awardedPoints?: number | null;
  }>
): AttemptScoreSummary {
  let earnedPoints = 0;
  let maxPoints = 0;
  let hasUngradedEssays = false;
  let answeredCount = 0;
  let correctCount = 0;

  const answerMap = new Map(answers.map((a) => [a.questionId, a]));

  for (const q of questions) {
    maxPoints += q.points;
    const ans = answerMap.get(q.id);

    if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
      if (ans?.selectedOptionId) {
        answeredCount++;
        const chosenOpt = q.options.find((o) => o.id === ans.selectedOptionId);
        if (chosenOpt?.isCorrect) {
          earnedPoints += q.points;
          correctCount++;
        }
      }
    } else if (q.type === "ESSAY") {
      if (ans?.answerText && ans.answerText.trim().length > 0) {
        answeredCount++;
      }
      if (ans?.awardedPoints !== undefined && ans.awardedPoints !== null) {
        earnedPoints += ans.awardedPoints;
      } else {
        hasUngradedEssays = true;
      }
    }
  }

  const finalScore = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 10000) / 100 : 0;

  return {
    earnedPoints: Math.round(earnedPoints * 100) / 100,
    maxPoints: Math.round(maxPoints * 100) / 100,
    finalScore,
    hasUngradedEssays,
    totalQuestions: questions.length,
    answeredCount,
    correctCount,
  };
}

export function calculateMultiAttemptFinalScore(
  attempts: Array<{ attemptNumber: number; finalScore: number | null; gradingStatus: string }>,
  gradingMethod: "HIGHEST" | "LATEST" | "AVERAGE" | string
): {
  highestScore: number;
  latestScore: number;
  averageScore: number;
  finalScore: number;
  totalAttempts: number;
} {
  if (attempts.length === 0) {
    return {
      highestScore: 0,
      latestScore: 0,
      averageScore: 0,
      finalScore: 0,
      totalAttempts: 0,
    };
  }

  const scores = attempts.map((a) => a.finalScore ?? 0);
  const highestScore = Math.max(...scores);
  const latestAttempt = [...attempts].sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  const latestScore = latestAttempt?.finalScore ?? 0;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  const averageScore = Math.round((sum / scores.length) * 100) / 100;

  let finalScore = highestScore;
  if (gradingMethod === "LATEST") {
    finalScore = latestScore;
  } else if (gradingMethod === "AVERAGE") {
    finalScore = averageScore;
  }

  return {
    highestScore: Math.round(highestScore * 100) / 100,
    latestScore: Math.round(latestScore * 100) / 100,
    averageScore,
    finalScore: Math.round(finalScore * 100) / 100,
    totalAttempts: attempts.length,
  };
}
