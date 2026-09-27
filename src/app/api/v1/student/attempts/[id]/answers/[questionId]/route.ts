import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { id: attemptId, questionId } = params;
    const body = await req.json();
    const { selectedOptionId, answerText, revision = 1 } = body;

    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: true,
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Sesi ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, error: { code: "ATTEMPT_NOT_ACTIVE", message: "Sesi ujian telah selesai atau waktu telah habis." } },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > attempt.deadlineAt) {
      // Auto-expire attempt
      await prisma.examAttempt.update({
        where: { id: attemptId },
        data: { status: "EXPIRED", submittedAt: now },
      });

      return NextResponse.json(
        { success: false, error: { code: "TIME_EXPIRED", message: "Waktu ujian telah berakhir." } },
        { status: 400 }
      );
    }

    // Check existing answer revision
    const existingAnswer = await prisma.answer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    });

    if (existingAnswer && existingAnswer.revision > revision) {
      // Out of order update from an older network packet
      return NextResponse.json({
        success: true,
        message: "Ignored older revision",
        data: {
          questionId,
          revision: existingAnswer.revision,
          savedAt: existingAnswer.savedAt,
        },
      });
    }

    // Save answer
    const savedAnswer = await prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      update: {
        selectedOptionId: selectedOptionId || null,
        answerText: answerText !== undefined ? answerText : null,
        revision,
        savedAt: now,
      },
      create: {
        attemptId,
        questionId,
        selectedOptionId: selectedOptionId || null,
        answerText: answerText !== undefined ? answerText : null,
        revision,
        savedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        questionId,
        selectedOptionId: savedAnswer.selectedOptionId,
        answerText: savedAnswer.answerText,
        revision: savedAnswer.revision,
        savedAt: savedAnswer.savedAt,
      },
    });
  } catch (error: any) {
    console.error("Autosave answer error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menyimpan jawaban." } },
      { status: 500 }
    );
  }
}
