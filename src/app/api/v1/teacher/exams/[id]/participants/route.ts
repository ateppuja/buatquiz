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
        examClasses: true,
      },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    const targetClassIds = exam.examClasses.map((ec) => ec.classId);

    // Get all students eligible for this exam
    const eligibleStudents = await prisma.student.findMany({
      where: {
        schoolId: session.schoolId,
        classId: { in: targetClassIds },
        status: "ACTIVE",
      },
      include: {
        class: true,
        attempts: {
          where: { examId },
          orderBy: { attemptNumber: "asc" },
        },
        examResults: {
          where: { examId },
        },
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    });

    const participants = eligibleStudents.map((s) => {
      const attempts = s.attempts;
      const result = s.examResults[0];
      const activeAttempt = attempts.find((a) => a.status === "IN_PROGRESS");
      const latestAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null;

      let status = "NOT_STARTED";
      if (activeAttempt) {
        status = "IN_PROGRESS";
      } else if (latestAttempt) {
        if (latestAttempt.gradingStatus === "PENDING") {
          status = "WAITING_GRADING";
        } else if (latestAttempt.status === "SUBMITTED") {
          status = "SUBMITTED";
        } else if (latestAttempt.status === "EXPIRED") {
          status = "EXPIRED";
        }
      }

      return {
        studentId: s.id,
        nis: s.nis,
        name: s.name,
        className: s.class.name,
        status,
        totalAttempts: attempts.length,
        maxAttempts: exam.maxAttempts,
        remainingAttempts: Math.max(0, exam.maxAttempts - attempts.length),
        activeAttemptId: activeAttempt?.id || null,
        activeAttemptDeadline: activeAttempt?.deadlineAt || null,
        finalScore: result?.finalScore ?? latestAttempt?.finalScore ?? null,
        gradingStatus: result?.gradingStatus ?? latestAttempt?.gradingStatus ?? "PENDING",
        attempts: attempts.map((a) => ({
          id: a.id,
          attemptNumber: a.attemptNumber,
          status: a.status,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          earnedPoints: a.earnedPoints,
          maxPoints: a.maxPoints,
          finalScore: a.finalScore,
          gradingStatus: a.gradingStatus,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          examCode: exam.examCode,
          durationMinutes: exam.durationMinutes,
          maxAttempts: exam.maxAttempts,
          status: exam.status,
        },
        totalEligible: eligibleStudents.length,
        participants,
      },
    });
  } catch (error: any) {
    console.error("Monitoring participants error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat data monitoring peserta." } },
      { status: 500 }
    );
  }
}
