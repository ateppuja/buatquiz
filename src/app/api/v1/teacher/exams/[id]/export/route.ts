import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExamReportExcelBuffer, ExportExamData } from "@/lib/excel-exporter";

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
        teacher: true,
        questions: {
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

    const studentMap = new Map<string, any>();
    for (const att of attempts) {
      if (!studentMap.has(att.studentId)) {
        const res = resultMap.get(att.studentId);
        studentMap.set(att.studentId, {
          studentId: att.studentId,
          nis: att.student.nis,
          name: att.student.name,
          className: att.student.class.name,
          totalAttempts: 0,
          highestScore: res?.highestScore ?? att.finalScore,
          latestScore: res?.latestScore ?? att.finalScore,
          averageScore: res?.averageScore ?? att.finalScore,
          finalScore: res?.finalScore ?? att.finalScore,
          gradingStatus: res?.gradingStatus ?? att.gradingStatus,
          attempts: [],
        });
      }

      const st = studentMap.get(att.studentId);
      st.totalAttempts++;
      st.attempts.push({
        attemptNumber: att.attemptNumber,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        status: att.status,
        finalScore: att.finalScore,
        earnedPoints: att.earnedPoints,
        maxPoints: att.maxPoints,
        gradingStatus: att.gradingStatus,
        answers: att.answers.map((a) => ({
          questionId: a.questionId,
          answerText: a.answerText,
          selectedOptionText: a.selectedOption?.optionText || null,
          awardedPoints: a.awardedPoints,
        })),
      });
    }

    const exportData: ExportExamData = {
      exam: {
        title: exam.title,
        subjectName: exam.subject.name,
        teacherName: exam.teacher.name,
        examCode: exam.examCode || "DRAFT",
        durationMinutes: exam.durationMinutes,
        startAt: exam.startAt,
        endAt: exam.endAt,
        gradingMethod: exam.gradingMethod,
        maxAttempts: exam.maxAttempts,
      },
      questions: exam.questions.map((q) => ({
        id: q.id,
        orderIndex: q.orderIndex,
        type: q.type,
        points: q.points,
        questionText: q.questionText,
      })),
      participants: Array.from(studentMap.values()),
    };

    const buffer = await generateExamReportExcelBuffer(exportData);
    const sanitizedTitle = exam.title.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Laporan_Ujian_${sanitizedTitle}_${exam.examCode || "export"}.xlsx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Export report error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat laporan Excel." } },
      { status: 500 }
    );
  }
}
