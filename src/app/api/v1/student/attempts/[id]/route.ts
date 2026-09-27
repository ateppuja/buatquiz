import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateAttemptScore, calculateMultiAttemptFinalScore } from "@/lib/scoring";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: attemptId } = params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        student: {
          include: { class: true },
        },
        questionOrder: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: { orderIndex: "asc" },
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

    const now = new Date();

    // Check if deadline passed while still IN_PROGRESS
    if (attempt.status === "IN_PROGRESS" && now > attempt.deadlineAt) {
      // Auto-expire
      const allExamQuestions = await prisma.question.findMany({
        where: { examId: attempt.examId },
        include: { options: true },
      });

      const scoreSummary = calculateAttemptScore(allExamQuestions, attempt.answers);

      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: {
          status: "EXPIRED",
          submittedAt: now,
          earnedPoints: scoreSummary.earnedPoints,
          maxPoints: scoreSummary.maxPoints,
          finalScore: scoreSummary.finalScore,
          gradingStatus: scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED",
        },
      });

      // Update multi-attempt summary
      const allAttempts = await prisma.examAttempt.findMany({
        where: { examId: attempt.examId, studentId: attempt.studentId },
      });

      const multiAttempt = calculateMultiAttemptFinalScore(
        allAttempts.map((a) => ({
          attemptNumber: a.attemptNumber,
          finalScore: a.id === attemptId ? scoreSummary.finalScore : a.finalScore,
          gradingStatus: a.id === attemptId ? (scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED") : a.gradingStatus,
        })),
        attempt.exam.gradingMethod
      );

      await prisma.examResult.upsert({
        where: { examId_studentId: { examId: attempt.examId, studentId: attempt.studentId } },
        update: {
          highestScore: multiAttempt.highestScore,
          latestScore: multiAttempt.latestScore,
          averageScore: multiAttempt.averageScore,
          finalScore: multiAttempt.finalScore,
          totalAttempts: multiAttempt.totalAttempts,
          gradingStatus: scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED",
        },
        create: {
          examId: attempt.examId,
          studentId: attempt.studentId,
          highestScore: multiAttempt.highestScore,
          latestScore: multiAttempt.latestScore,
          averageScore: multiAttempt.averageScore,
          finalScore: multiAttempt.finalScore,
          totalAttempts: multiAttempt.totalAttempts,
          gradingStatus: scoreSummary.hasUngradedEssays ? "PENDING" : "GRADED",
        },
      });

      attempt.status = "EXPIRED";
    }

    // Build sanitized questions array
    const sanitizedQuestions = attempt.questionOrder.map((qo, idx) => {
      const q = qo.question;
      let options = q.options;

      // Re-order options based on snapshot order
      if (qo.optionOrderJson) {
        try {
          const optionOrderIds: string[] = JSON.parse(qo.optionOrderJson);
          const optMap = new Map(q.options.map((o) => [o.id, o]));
          const reordered: typeof q.options = [];
          optionOrderIds.forEach((optId) => {
            const opt = optMap.get(optId);
            if (opt) reordered.push(opt);
          });
          if (reordered.length > 0) options = reordered;
        } catch {}
      }

      return {
        id: q.id,
        number: idx + 1,
        type: q.type,
        questionText: q.questionText,
        questionImage: q.questionImage,
        points: q.points,
        options: options.map((o, optIdx) => ({
          id: o.id,
          key: String.fromCharCode(65 + optIdx), // normalized A, B, C, D
          text: o.optionText,
        })),
      };
    });

    const answerMap: Record<string, { selectedOptionId: string | null; answerText: string | null; revision: number }> = {};
    attempt.answers.forEach((a) => {
      answerMap[a.questionId] = {
        selectedOptionId: a.selectedOptionId,
        answerText: a.answerText,
        revision: a.revision,
      };
    });

    const timeRemainingSeconds = Math.max(0, Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000));

    return NextResponse.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          deadlineAt: attempt.deadlineAt,
          timeRemainingSeconds,
          navigationMode: attempt.exam.navigationMode,
        },
        exam: {
          id: attempt.exam.id,
          title: attempt.exam.title,
          examCode: attempt.exam.examCode,
          subjectName: attempt.exam.subject.name,
          durationMinutes: attempt.exam.durationMinutes,
          totalQuestions: sanitizedQuestions.length,
        },
        student: {
          id: attempt.student.id,
          nis: attempt.student.nis,
          name: attempt.student.name,
          className: attempt.student.class.name,
        },
        questions: sanitizedQuestions,
        answers: answerMap,
      },
    });
  } catch (error: any) {
    console.error("Get attempt error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat sesi pengerjaan." } },
      { status: 500 }
    );
  }
}
