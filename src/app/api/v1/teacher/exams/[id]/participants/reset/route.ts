import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id: examId } = params;
    const body = await req.json();
    const { studentId, reason } = body;

    if (!studentId || !reason) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "ID murid dan alasan reset wajib diisi." } },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Delete attempts and answers or reset attempt records for this student on this exam
    await prisma.answer.deleteMany({
      where: {
        attempt: {
          examId,
          studentId,
        },
      },
    });

    await prisma.attemptQuestionOrder.deleteMany({
      where: {
        attempt: {
          examId,
          studentId,
        },
      },
    });

    await prisma.examAttempt.deleteMany({
      where: {
        examId,
        studentId,
      },
    });

    await prisma.examResult.deleteMany({
      where: {
        examId,
        studentId,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "ATTEMPT_RESET",
        details: JSON.stringify({
          examId,
          studentId,
          studentName: student.name,
          nis: student.nis,
          reason,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Kuota ujian untuk ${student.name} (NIS ${student.nis}) berhasil direset.`,
    });
  } catch (error: any) {
    console.error("Reset attempt error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mereset kuota percobaan murid." } },
      { status: 500 }
    );
  }
}
