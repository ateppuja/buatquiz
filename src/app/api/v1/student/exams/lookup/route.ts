import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExamCode } from "@/lib/code-generator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawCode = body.code || "";
    const examCode = normalizeExamCode(rawCode);

    if (!examCode || examCode.length < 4) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_CODE", message: "Masukkan kode ujian yang valid." } },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { examCode },
      include: {
        subject: true,
        school: { select: { id: true, name: true, logo: true } },
        examClasses: {
          include: {
            class: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, error: { code: "EXAM_NOT_FOUND", message: "Ujian dengan kode tersebut tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (exam.status === "DRAFT") {
      return NextResponse.json(
        { success: false, error: { code: "EXAM_NOT_PUBLISHED", message: "Ujian belum diterbitkan oleh guru." } },
        { status: 400 }
      );
    }

    const now = new Date();
    const isStarted = now >= exam.startAt;
    const isEnded = now > exam.endAt || exam.status === "CLOSED";

    return NextResponse.json({
      success: true,
      data: {
        examId: exam.id,
        examCode: exam.examCode,
        title: exam.title,
        description: exam.description,
        subjectName: exam.subject.name,
        schoolName: exam.school.name,
        durationMinutes: exam.durationMinutes,
        startAt: exam.startAt,
        endAt: exam.endAt,
        maxAttempts: exam.maxAttempts,
        status: exam.status,
        isStarted,
        isEnded,
        requiresPin: Boolean(exam.pin),
        eligibleClasses: exam.examClasses.map((ec) => ({
          id: ec.class.id,
          name: ec.class.name,
          gradeLevel: ec.class.gradeLevel,
        })),
      },
    });
  } catch (error: any) {
    console.error("Lookup exam error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memproses kode ujian." } },
      { status: 500 }
    );
  }
}
