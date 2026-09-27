import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateExamCode } from "@/lib/code-generator";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id } = params;

    // Fetch original exam with all questions, options, and assigned classes
    const originalExam = await prisma.exam.findUnique({
      where: { id },
      include: {
        examClasses: true,
        questions: {
          include: {
            options: {
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!originalExam || originalExam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian sumber tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Generate a unique exam code
    let uniqueCode = generateExamCode(8);
    let isCodeUnique = false;
    let attempts = 0;
    while (!isCodeUnique && attempts < 10) {
      const existing = await prisma.exam.findUnique({ where: { examCode: uniqueCode } });
      if (!existing) {
        isCodeUnique = true;
      } else {
        uniqueCode = generateExamCode(8);
        attempts++;
      }
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Create cloned exam in DRAFT status
    const clonedExam = await prisma.exam.create({
      data: {
        schoolId: session.schoolId,
        teacherId: session.userId,
        subjectId: originalExam.subjectId,
        title: `${originalExam.title} (Salinan)`,
        description: originalExam.description,
        instructions: originalExam.instructions,
        examCode: uniqueCode,
        durationMinutes: originalExam.durationMinutes,
        startAt: now,
        endAt: tomorrow,
        maxAttempts: originalExam.maxAttempts,
        gradingMethod: originalExam.gradingMethod,
        resultVisibility: originalExam.resultVisibility,
        shuffleQuestions: originalExam.shuffleQuestions,
        shuffleOptions: originalExam.shuffleOptions,
        navigationMode: originalExam.navigationMode,
        showAnswerKey: originalExam.showAnswerKey,
        pin: originalExam.pin,
        status: "DRAFT",
      },
    });

    // Clone assigned classes
    if (originalExam.examClasses && originalExam.examClasses.length > 0) {
      for (const ec of originalExam.examClasses) {
        await prisma.examClass.create({
          data: {
            examId: clonedExam.id,
            classId: ec.classId,
          },
        }).catch(() => {});
      }
    }

    // Clone all questions and their options
    if (originalExam.questions && originalExam.questions.length > 0) {
      for (const q of originalExam.questions) {
        const clonedQ = await prisma.question.create({
          data: {
            examId: clonedExam.id,
            type: q.type,
            questionText: q.questionText,
            questionImage: q.questionImage,
            points: q.points,
            explanation: q.explanation,
            orderIndex: q.orderIndex,
          },
        });

        if (q.options && q.options.length > 0) {
          for (const opt of q.options) {
            await prisma.questionOption.create({
              data: {
                questionId: clonedQ.id,
                optionKey: opt.optionKey,
                optionText: opt.optionText,
                isCorrect: opt.isCorrect,
                orderIndex: opt.orderIndex,
              },
            });
          }
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "EXAM_DUPLICATED",
        details: `Menduplikasi ujian "${originalExam.title}" menjadi "${clonedExam.title}" (${clonedExam.examCode})`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Ujian "${originalExam.title}" berhasil diduplikasi!`,
      data: {
        id: clonedExam.id,
        examCode: clonedExam.examCode,
        title: clonedExam.title,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menduplikasi ujian." } },
      { status: 500 }
    );
  }
}
