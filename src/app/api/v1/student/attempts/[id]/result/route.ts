import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: attemptId } = params;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            subject: true,
            questions: {
              include: {
                options: true,
              },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        student: {
          include: { class: true },
        },
        answers: {
          include: {
            selectedOption: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Sesi ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    const exam = attempt.exam;
    const student = attempt.student;

    // Fetch student's ExamResult and all attempts
    const [examResult, allAttempts] = await Promise.all([
      prisma.examResult.findUnique({
        where: { examId_studentId: { examId: exam.id, studentId: student.id } },
      }),
      prisma.examAttempt.findMany({
        where: { examId: exam.id, studentId: student.id },
        orderBy: { attemptNumber: "asc" },
      }),
    ]);

    const isPublished = exam.resultVisibility === "IMMEDIATE" || examResult?.isPublished;
    const now = new Date();
    const isExamClosed = now > exam.endAt || exam.status === "CLOSED";
    const isQuotaExhausted = allAttempts.length >= exam.maxAttempts;
    const canShowAnswerKey = exam.showAnswerKey && (isExamClosed || isQuotaExhausted);

    const questionReview = canShowAnswerKey
      ? exam.questions.map((q) => {
          const ans = attempt.answers.find((a) => a.questionId === q.id);
          return {
            id: q.id,
            type: q.type,
            questionText: q.questionText,
            points: q.points,
            explanation: q.explanation,
            options: q.options.map((o) => ({
              id: o.id,
              key: o.optionKey,
              text: o.optionText,
              isCorrect: o.isCorrect,
            })),
            studentAnswer: {
              selectedOptionId: ans?.selectedOptionId || null,
              selectedOptionText: ans?.selectedOption?.optionText || null,
              answerText: ans?.answerText || null,
              awardedPoints: ans?.awardedPoints ?? null,
              feedback: ans?.feedback || null,
            },
          };
        })
      : [];

    return NextResponse.json({
      success: true,
      data: {
        isPublished,
        canShowAnswerKey,
        exam: {
          id: exam.id,
          title: exam.title,
          subjectName: exam.subject.name,
          examCode: exam.examCode,
          gradingMethod: exam.gradingMethod,
          maxAttempts: exam.maxAttempts,
        },
        student: {
          id: student.id,
          nis: student.nis,
          name: student.name,
          className: student.class.name,
        },
        currentAttempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          earnedPoints: attempt.earnedPoints,
          maxPoints: attempt.maxPoints,
          finalScore: attempt.finalScore,
          gradingStatus: attempt.gradingStatus,
        },
        allAttempts: allAttempts.map((a) => ({
          id: a.id,
          attemptNumber: a.attemptNumber,
          status: a.status,
          finalScore: a.finalScore,
          gradingStatus: a.gradingStatus,
        })),
        examResult: {
          highestScore: examResult?.highestScore ?? attempt.finalScore,
          latestScore: examResult?.latestScore ?? attempt.finalScore,
          averageScore: examResult?.averageScore ?? attempt.finalScore,
          finalScore: examResult?.finalScore ?? attempt.finalScore,
          gradingStatus: examResult?.gradingStatus ?? attempt.gradingStatus,
        },
        questionReview,
      },
    });
  } catch (error: any) {
    console.error("Get result error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat hasil ujian." } },
      { status: 500 }
    );
  }
}
