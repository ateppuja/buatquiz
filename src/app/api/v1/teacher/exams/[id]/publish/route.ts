import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExamCode } from "@/lib/code-generator";

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

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        examClasses: true,
        questions: {
          include: { options: true },
        },
      },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (session.role === "TEACHER" && exam.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses untuk menerbitkan ujian ini." } },
        { status: 403 }
      );
    }

    // Validations before publishing
    if (exam.examClasses.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_CLASSES", message: "Pilih minimal satu kelas peserta sebelum menerbitkan ujian." } },
        { status: 400 }
      );
    }

    if (exam.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NO_QUESTIONS", message: "Ujian minimal harus memiliki satu butir soal." } },
        { status: 400 }
      );
    }

    // Check that all PG and BS questions have at least 1 correct option
    for (let i = 0; i < exam.questions.length; i++) {
      const q = exam.questions[i];
      if (q.type === "MULTIPLE_CHOICE" || q.type === "TRUE_FALSE") {
        const hasCorrect = q.options.some((o) => o.isCorrect);
        if (!hasCorrect) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INVALID_KEY",
                message: `Soal nomor ${i + 1} (${q.type === "MULTIPLE_CHOICE" ? "Pilihan Ganda" : "Benar/Salah"}) belum memiliki kunci jawaban.`,
              },
            },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique 8-character exam code
    let examCode = exam.examCode;
    if (!examCode) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        attempts++;
        const candidate = generateExamCode(8);
        const exists = await prisma.exam.findUnique({ where: { examCode: candidate } });
        if (!exists) {
          examCode = candidate;
          isUnique = true;
        }
      }
    }

    const updated = await prisma.exam.update({
      where: { id: examId },
      data: {
        examCode,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "PUBLISH_EXAM",
        details: JSON.stringify({ examId, examCode, title: exam.title }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        examId: updated.id,
        examCode: updated.examCode,
        status: updated.status,
        publishedAt: updated.publishedAt,
      },
    });
  } catch (error: any) {
    console.error("Publish exam error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menerbitkan ujian." } },
      { status: 500 }
    );
  }
}
