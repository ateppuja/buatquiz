import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { questionId } = params;
    const body = await req.json();
    const { type, questionText, points, explanation, options, questionImage } = body;

    const updateData: any = {};
    if (type) updateData.type = type;
    if (questionText) updateData.questionText = questionText;
    if (points !== undefined) updateData.points = parseFloat(points);
    if (explanation !== undefined) updateData.explanation = explanation || null;
    if (questionImage !== undefined) updateData.questionImage = questionImage || null;

    const question = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
    });

    if (Array.isArray(options)) {
      await prisma.questionOption.deleteMany({ where: { questionId } });
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

    const completeQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: { orderBy: { orderIndex: "asc" } } },
    });

    return NextResponse.json({ success: true, data: completeQuestion });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui soal." } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { questionId } = params;

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({ success: true, message: "Soal berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus soal." } },
      { status: 500 }
    );
  }
}
