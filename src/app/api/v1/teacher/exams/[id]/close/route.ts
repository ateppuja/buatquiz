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

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (session.role === "TEACHER" && exam.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses untuk menutup ujian ini." } },
        { status: 403 }
      );
    }

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: { status: "CLOSED" },
    });

    // Auto-expire any in_progress attempts
    await prisma.examAttempt.updateMany({
      where: { examId, status: "IN_PROGRESS" },
      data: { status: "EXPIRED", submittedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "CLOSE_EXAM",
        details: JSON.stringify({ examId, title: exam.title, closedBy: session.role }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menutup ujian." } },
      { status: 500 }
    );
  }
}
