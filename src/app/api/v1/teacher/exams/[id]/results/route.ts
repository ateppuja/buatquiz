import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id: examId } = params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        subject: true,
        questions: {
          include: {
            options: { orderBy: { orderIndex: "asc" } },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Fetch all attempts with answers and student details
    const attempts = await prisma.examAttempt.findMany({
      where: { examId },
      include: {
        student: { include: { class: true } },
        answers: {
          include: {
            question: true,
            selectedOption: true,
          },
        },
      },
      orderBy: [{ student: { name: "asc" } }, { attemptNumber: "asc" }],
    });

    const examResults = await prisma.examResult.findMany({
      where: { examId },
    });
    const resultMap = new Map(examResults.map((r) => [r.studentId, r]));

    // Group by student
    const studentMap = new Map<string, any>();

    for (const att of attempts) {
      if (!studentMap.has(att.studentId)) {
        const res = resultMap.get(att.studentId);
        studentMap.set(att.studentId, {
          studentId: att.studentId,
          nis: att.student.nis,
          name: att.student.name,
          className: att.student.class.name,
          finalScore: res?.finalScore ?? att.finalScore ?? 0,
          highestScore: res?.highestScore ?? att.finalScore ?? 0,
          latestScore: res?.latestScore ?? att.finalScore ?? 0,
          averageScore: res?.averageScore ?? att.finalScore ?? 0,
          gradingStatus: res?.gradingStatus ?? att.gradingStatus,
          isPublished: res?.isPublished ?? (exam.resultVisibility === "IMMEDIATE"),
          totalAttempts: 0,
          attempts: [],
        });
      }

      const st = studentMap.get(att.studentId);
      st.totalAttempts++;
      st.attempts.push({
        id: att.id,
        attemptNumber: att.attemptNumber,
        status: att.status,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        earnedPoints: att.earnedPoints,
        maxPoints: att.maxPoints,
        finalScore: att.finalScore,
        gradingStatus: att.gradingStatus,
        answers: att.answers.map((a) => ({
          id: a.id,
          questionId: a.questionId,
          questionType: a.question.type,
          questionText: a.question.questionText,
          points: a.question.points,
          selectedOptionId: a.selectedOptionId,
          selectedOptionKey: a.selectedOption?.optionKey || null,
          selectedOptionText: a.selectedOption?.optionText || null,
          answerText: a.answerText,
          awardedPoints: a.awardedPoints,
          feedback: a.feedback,
        })),
      });
    }

    const participants = Array.from(studentMap.values());

    // Compute aggregate statistics
    const scores = participants.map((p) => p.finalScore).filter((s) => s !== null && s !== undefined) as number[];
    const stats = {
      totalParticipants: participants.length,
      averageScore: scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      pendingGradingCount: participants.filter((p) => p.gradingStatus === "PENDING").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          examCode: exam.examCode,
          subjectName: exam.subject.name,
          gradingMethod: exam.gradingMethod,
          resultVisibility: exam.resultVisibility,
          maxAttempts: exam.maxAttempts,
          status: exam.status,
        },
        questions: exam.questions,
        stats,
        participants,
      },
    });
  } catch (error: any) {
    console.error("Get exam results error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat hasil ujian." } },
      { status: 500 }
    );
  }
}
