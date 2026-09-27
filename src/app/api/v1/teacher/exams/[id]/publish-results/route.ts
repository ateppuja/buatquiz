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

    // Set resultVisibility to IMMEDIATE and mark all exam results as published
    await prisma.exam.update({
      where: { id: examId },
      data: { resultVisibility: "IMMEDIATE" },
    });

    await prisma.examResult.updateMany({
      where: { examId },
      data: { isPublished: true },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "PUBLISH_RESULTS",
        details: JSON.stringify({ examId, title: exam.title }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hasil ujian berhasil dipublikasikan kepada murid.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memublikasikan hasil ujian." } },
      { status: 500 }
    );
  }
}
