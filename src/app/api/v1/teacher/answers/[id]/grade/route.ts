import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateAttemptScore, calculateMultiAttemptFinalScore } from "@/lib/scoring";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id: answerId } = params;
    const body = await req.json();
    const { awardedPoints, feedback } = body;

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true,
        attempt: {
          include: {
            exam: true,
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Jawaban tidak ditemukan." } },
        { status: 404 }
      );
    }

    const maxQuestionPoints = answer.question.points;
    const parsedPoints = parseFloat(awardedPoints);

    if (isNaN(parsedPoints) || parsedPoints < 0 || parsedPoints > maxQuestionPoints) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_POINTS",
            message: `Poin nilai harus antara 0 dan bobot maksimal (${maxQuestionPoints}).`,
          },
        },
        { status: 400 }
      );
    }

    // 1. Update this answer
    await prisma.answer.update({
      where: { id: answerId },
      data: {
        awardedPoints: parsedPoints,
        feedback: feedback || null,
      },
    });

    const attemptId = answer.attemptId;
    const examId = answer.attempt.examId;
    const studentId = answer.attempt.studentId;

    // 2. Fetch all questions and answers for this attempt to recalculate attempt score
    const examQuestions = await prisma.question.findMany({
      where: { examId },
      include: { options: true },
    });

    const attemptAnswers = await prisma.answer.findMany({
      where: { attemptId },
    });

    const scoreSummary = calculateAttemptScore(examQuestions, attemptAnswers);

    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        earnedPoints: scoreSummary.earnedPoints,
        maxPoints: scoreSummary.maxPoints,
        finalScore: scoreSummary.finalScore,
        gradingStatus: scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED",
      },
    });

    // 3. Recalculate ExamResult across all attempts for this student
    const allAttempts = await prisma.examAttempt.findMany({
      where: { examId, studentId },
    });

    const multiAttemptSummary = calculateMultiAttemptFinalScore(
      allAttempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        finalScore: a.finalScore,
        gradingStatus: a.gradingStatus,
      })),
      answer.attempt.exam.gradingMethod
    );

    const hasAnyPending = allAttempts.some((a) => a.gradingStatus === "PENDING");

    await prisma.examResult.upsert({
      where: { examId_studentId: { examId, studentId } },
      update: {
        highestScore: multiAttemptSummary.highestScore,
        latestScore: multiAttemptSummary.latestScore,
        averageScore: multiAttemptSummary.averageScore,
        finalScore: multiAttemptSummary.finalScore,
        totalAttempts: multiAttemptSummary.totalAttempts,
        gradingStatus: hasAnyPending ? "PENDING" : "GRADED",
      },
      create: {
        examId,
        studentId,
        highestScore: multiAttemptSummary.highestScore,
        latestScore: multiAttemptSummary.latestScore,
        averageScore: multiAttemptSummary.averageScore,
        finalScore: multiAttemptSummary.finalScore,
        totalAttempts: multiAttemptSummary.totalAttempts,
        gradingStatus: hasAnyPending ? "PENDING" : "GRADED",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        attempt: updatedAttempt,
        multiAttemptSummary,
      },
    });
  } catch (error: any) {
    console.error("Grade essay answer error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memberikan nilai esai." } },
      { status: 500 }
    );
  }
}
