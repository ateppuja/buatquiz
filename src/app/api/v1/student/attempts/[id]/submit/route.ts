import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAttemptScore, calculateMultiAttemptFinalScore } from "@/lib/scoring";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: attemptId } = params;

    // Optional client answers payload to guarantee all pending answers are persisted
    let clientAnswers: Record<string, { selectedOptionId?: string | null; answerText?: string | null; revision?: number }> | null = null;
    try {
      const body = await req.json();
      if (body?.answers && typeof body.answers === "object") {
        clientAnswers = body.answers;
      }
    } catch {
      // Empty or non-JSON body is acceptable
    }

    if (clientAnswers) {
      const saveTimestamp = new Date();
      for (const [qId, ans] of Object.entries(clientAnswers)) {
        if (!ans) continue;
        const selId = ans.selectedOptionId || null;
        const txt = ans.answerText !== undefined && ans.answerText !== null ? String(ans.answerText).trim() : null;
        const rev = Number(ans.revision) || 1;

        await prisma.answer.upsert({
          where: { attemptId_questionId: { attemptId, questionId: qId } },
          update: {
            selectedOptionId: selId,
            answerText: txt && txt.length > 0 ? txt : null,
            revision: rev,
            savedAt: saveTimestamp,
          },
          create: {
            attemptId,
            questionId: qId,
            selectedOptionId: selId,
            answerText: txt && txt.length > 0 ? txt : null,
            revision: rev,
            savedAt: saveTimestamp,
          },
        });
      }
    }

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Sesi ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (attempt.status === "SUBMITTED") {
      return NextResponse.json({
        success: true,
        message: "Ujian sudah dikumpulkan sebelumnya.",
        data: {
          attemptId: attempt.id,
          status: attempt.status,
          finalScore: attempt.finalScore,
          gradingStatus: attempt.gradingStatus,
        },
      });
    }

    const now = new Date();
    const scoreSummary = calculateAttemptScore(attempt.exam.questions, attempt.answers);

    // Update attempt status to SUBMITTED
    const updatedAttempt = await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: "SUBMITTED",
        submittedAt: now,
        earnedPoints: scoreSummary.earnedPoints,
        maxPoints: scoreSummary.maxPoints,
        finalScore: scoreSummary.finalScore,
        gradingStatus: scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED",
      },
    });

    // Recalculate multi-attempt summary for this student
    const allAttempts = await prisma.examAttempt.findMany({
      where: { examId: attempt.examId, studentId: attempt.studentId },
    });

    const multiSummary = calculateMultiAttemptFinalScore(
      allAttempts.map((a) => ({
        attemptNumber: a.attemptNumber,
        finalScore: a.id === attemptId ? scoreSummary.finalScore : a.finalScore,
        gradingStatus: a.id === attemptId ? (scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED") : a.gradingStatus,
      })),
      attempt.exam.gradingMethod
    );

    const hasAnyPending = allAttempts.some((a) => (a.id === attemptId ? scoreSummary.hasUngradedEssays : a.gradingStatus === "PENDING"));

    await prisma.examResult.upsert({
      where: { examId_studentId: { examId: attempt.examId, studentId: attempt.studentId } },
      update: {
        highestScore: multiSummary.highestScore,
        latestScore: multiSummary.latestScore,
        averageScore: multiSummary.averageScore,
        finalScore: multiSummary.finalScore,
        totalAttempts: multiSummary.totalAttempts,
        gradingStatus: hasAnyPending ? "PENDING" : "GRADED",
        isPublished: attempt.exam.resultVisibility === "IMMEDIATE",
      },
      create: {
        examId: attempt.examId,
        studentId: attempt.studentId,
        highestScore: multiSummary.highestScore,
        latestScore: multiSummary.latestScore,
        averageScore: multiSummary.averageScore,
        finalScore: multiSummary.finalScore,
        totalAttempts: multiSummary.totalAttempts,
        gradingStatus: hasAnyPending ? "PENDING" : "GRADED",
        isPublished: attempt.exam.resultVisibility === "IMMEDIATE",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil diselesaikan dan dikumpulkan.",
      data: {
        attemptId: updatedAttempt.id,
        status: updatedAttempt.status,
        earnedPoints: updatedAttempt.earnedPoints,
        maxPoints: updatedAttempt.maxPoints,
        finalScore: updatedAttempt.finalScore,
        gradingStatus: updatedAttempt.gradingStatus,
        resultVisibility: attempt.exam.resultVisibility,
        scoreSummary,
        multiSummary,
      },
    });
  } catch (error: any) {
    console.error("Submit attempt error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengumpulkan ujian." } },
      { status: 500 }
    );
  }
}
