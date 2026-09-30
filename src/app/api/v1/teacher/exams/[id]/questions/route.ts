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
    const { type, questionText, points, explanation, options, questionImage } = body;

    if (!type || !questionText) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Tipe soal dan teks pertanyaan wajib diisi." } },
        { status: 400 }
      );
    }

    // Get current max orderIndex
    const lastQuestion = await prisma.question.findFirst({
      where: { examId },
      orderBy: { orderIndex: "desc" },
    });
    const nextOrder = (lastQuestion?.orderIndex ?? -1) + 1;

    const question = await prisma.question.create({
      data: {
        examId,
        type,
        questionText,
        questionImage: questionImage || null,
        points: parseFloat(points || "1"),
        explanation: explanation || null,
        orderIndex: nextOrder,
      },
    });

    if (type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
      if (Array.isArray(options) && options.length > 0) {
        for (let i = 0; i < options.length; i++) {
          const opt = options[i];
          await prisma.questionOption.create({
            data: {
              questionId: question.id,
              optionKey: opt.key || String.fromCharCode(65 + i),
              optionText: opt.text || "",
              isCorrect: Boolean(opt.isCorrect),
              orderIndex: i,
            },
          });
        }
      }
    }

    const completeQuestion = await prisma.question.findUnique({
      where: { id: question.id },
      include: { options: { orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json({ success: true, data: completeQuestion });
  } catch (error: any) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menambahkan butir soal." } },
      { status: 500 }
    );
  }
}
