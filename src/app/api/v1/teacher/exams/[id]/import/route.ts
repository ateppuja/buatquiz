import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDocxBuffer } from "@/lib/docx-parser";
import { parseQuestionsExcelBuffer } from "@/lib/excel-parser";

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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const action = formData.get("action") as string; // "preview" | "commit"
    const questionsJson = formData.get("questions") as string;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Action 1: Commit selected questions after user review
    if (action === "commit" && questionsJson) {
      const questionsToSave = JSON.parse(questionsJson);
      if (!Array.isArray(questionsToSave) || questionsToSave.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NO_QUESTIONS", message: "Tidak ada soal yang dipilih untuk disimpan." } },
          { status: 400 }
        );
      }

      const lastQuestion = await prisma.question.findFirst({
        where: { examId },
        orderBy: { orderIndex: "desc" },
      });
      let currentOrder = (lastQuestion?.orderIndex ?? -1) + 1;
      let insertedCount = 0;

      for (const q of questionsToSave) {
        if (!q.isValid && q.errors?.length > 0) continue;

        const createdQ = await prisma.question.create({
          data: {
            examId,
            type: q.type,
            questionText: q.questionText,
            questionImage: q.questionImage || null,
            points: parseFloat(q.points || "1"),
            explanation: q.explanation || null,
            orderIndex: currentOrder++,
          },
        });

        if (Array.isArray(q.options) && q.options.length > 0) {
          for (let i = 0; i < q.options.length; i++) {
            const opt = q.options[i];
            await prisma.questionOption.create({
              data: {
                questionId: createdQ.id,
                optionKey: opt.key || String.fromCharCode(65 + i),
                optionText: opt.text || "",
                isCorrect: Boolean(opt.isCorrect),
                orderIndex: i,
              },
            });
          }
        }
        insertedCount++;
      }

      return NextResponse.json({
        success: true,
        message: `Berhasil menambahkan ${insertedCount} butir soal ke dalam ujian.`,
        data: { insertedCount },
      });
    }

    // Action 2: Parse uploaded file (Word or Excel)
    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: "NO_FILE", message: "File dokumen tidak ditemukan." } },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());

    let parseResult;
    if (fileName.endsWith(".docx")) {
      parseResult = await parseDocxBuffer(buffer);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      parseResult = parseQuestionsExcelBuffer(buffer);
    } else {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FILE_TYPE", message: "Hanya mendukung file Word (.docx) atau Excel (.xlsx)." } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        totalParsed: parseResult.totalParsed,
        validCount: parseResult.validCount,
        errorCount: parseResult.errorCount,
        globalErrors: parseResult.globalErrors,
        questions: parseResult.questions,
      },
    });
  } catch (error: any) {
    console.error("Import questions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memproses file import soal." } },
      { status: 500 }
    );
  }
}
