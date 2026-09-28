import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const whereClause: any = { schoolId: session.schoolId };
    if (session.role === "TEACHER") {
      whereClause.teacherId = session.userId;
    }

    const exams = await prisma.exam.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: { select: { name: true, email: true } },
        examClasses: { include: { class: true } },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: [{ startAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: exams });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat daftar ujian." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const body = await req.json();
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

    if (!title || !subjectId || !startAt || !endAt) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Judul, Mata Pelajaran, Waktu Mulai, dan Waktu Berakhir wajib diisi." } },
        { status: 400 }
      );
    }

    const startDate = parseDateInput(startAt);
    const endDate = parseDateInput(endAt);

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_DATES", message: "Format waktu mulai atau waktu berakhir tidak valid." } },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_DATES", message: "Waktu berakhir harus lebih besar dari waktu mulai." } },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        schoolId: session.schoolId,
        teacherId: session.userId,
        subjectId,
        title,
        description: description || null,
        instructions: instructions || null,
        durationMinutes: parseInt(durationMinutes || "60", 10),
        startAt: startDate,
        endAt: endDate,
        maxAttempts: parseInt(maxAttempts || "1", 10),
        gradingMethod: gradingMethod || "HIGHEST",
        resultVisibility: resultVisibility || "MANUAL",
        shuffleQuestions: Boolean(shuffleQuestions),
        shuffleOptions: Boolean(shuffleOptions),
        navigationMode: navigationMode || "FREE",
        showAnswerKey: Boolean(showAnswerKey),
        pin: pin || null,
        status: "DRAFT",
      },
    });

    if (Array.isArray(classIds) && classIds.length > 0) {
      for (const classId of classIds) {
        await prisma.examClass.create({
          data: { examId: exam.id, classId },
        }).catch(() => {});
      }
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error: any) {
    console.error("Create exam error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat draft ujian." } },
      { status: 500 }
    );
  }
}
