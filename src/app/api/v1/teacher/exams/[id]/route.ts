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

    const { id } = params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: { select: { id: true, name: true, email: true } },
        examClasses: { include: { class: true } },
        questions: {
          include: {
            options: { orderBy: { orderIndex: "asc" } },
          },
          orderBy: { orderIndex: "asc" },
        },
        _count: {
          select: {
            attempts: true,
            examResults: true,
          },
        },
      },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Teachers can only view their own exams unless they are admin
    if (session.role === "TEACHER" && exam.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses ke ujian ini." } },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat detail ujian." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (session.role === "TEACHER" && exam.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses untuk mengubah ujian ini." } },
        { status: 403 }
      );
    }

    const {
      title,
      subjectId,
      classIds,
      description,
      instructions,
      durationMinutes,
      startAt,
      endAt,
      maxAttempts,
      gradingMethod,
      resultVisibility,
      shuffleQuestions,
      shuffleOptions,
      navigationMode,
      showAnswerKey,
      pin,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (subjectId) updateData.subjectId = subjectId;
    if (description !== undefined) updateData.description = description;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (durationMinutes) updateData.durationMinutes = parseInt(durationMinutes, 10);
    if (startAt) updateData.startAt = new Date(startAt);
    if (endAt) updateData.endAt = new Date(endAt);
    if (maxAttempts) updateData.maxAttempts = parseInt(maxAttempts, 10);
    if (gradingMethod) updateData.gradingMethod = gradingMethod;
    if (resultVisibility) updateData.resultVisibility = resultVisibility;
    if (shuffleQuestions !== undefined) updateData.shuffleQuestions = Boolean(shuffleQuestions);
    if (shuffleOptions !== undefined) updateData.shuffleOptions = Boolean(shuffleOptions);
    if (navigationMode) updateData.navigationMode = navigationMode;
    if (showAnswerKey !== undefined) updateData.showAnswerKey = Boolean(showAnswerKey);
    if (pin !== undefined) updateData.pin = pin || null;

    const updated = await prisma.exam.update({
      where: { id },
      data: updateData,
    });

    if (Array.isArray(classIds)) {
      await prisma.examClass.deleteMany({ where: { examId: id } });
      for (const classId of classIds) {
        await prisma.examClass.create({
          data: { examId: id, classId },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui ujian." } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id } = params;

    const exam = await prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (session.role === "TEACHER" && exam.teacherId !== session.userId) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Anda tidak memiliki akses untuk menghapus ujian ini." } },
        { status: 403 }
      );
    }

    await prisma.exam.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "EXAM_DELETED",
        details: `Menghapus ujian: ${exam.title} (Kode: ${exam.examCode || "-"})`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Ujian "${exam.title}" berhasil dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus ujian." } },
      { status: 500 }
    );
  }
}
