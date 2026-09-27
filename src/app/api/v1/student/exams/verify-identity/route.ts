import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeExamCode } from "@/lib/code-generator";
import { signStudentExamToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, classId, pin } = body;

    const examCode = normalizeExamCode(code || "");
    const rawName = String(name || "").trim();
    const cleanName = rawName.toLowerCase();

    if (!examCode || !rawName || !classId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama lengkap dan kelas wajib diisi." } },
        { status: 400 }
      );
    }

    // 1. Find Exam
    const exam = await prisma.exam.findUnique({
      where: { examCode },
      include: {
        examClasses: true,
        school: true,
      },
    });

    if (!exam || exam.status === "DRAFT") {
      return NextResponse.json(
        { success: false, error: { code: "EXAM_NOT_AVAILABLE", message: "Ujian tidak tersedia." } },
        { status: 404 }
      );
    }

    if (exam.status === "CLOSED") {
      return NextResponse.json(
        { success: false, error: { code: "EXAM_CLOSED", message: "Ujian ini telah ditutup oleh guru/sekolah." } },
        { status: 400 }
      );
    }

    // Check if selected Class is allowed in this Exam
    const isClassAllowed = exam.examClasses.some((ec) => ec.classId === classId);
    if (!isClassAllowed) {
      return NextResponse.json(
        { success: false, error: { code: "CLASS_NOT_ELIGIBLE", message: "Kelas yang dipilih tidak terdaftar sebagai peserta ujian ini." } },
        { status: 403 }
      );
    }

    // Check optional Exam PIN
    if (exam.pin && exam.pin.trim() !== "" && exam.pin !== pin) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PIN", message: "PIN ujian yang dimasukkan salah." } },
        { status: 400 }
      );
    }

    // 2. Verify or Auto-Register Student Record by Name and Class
    const studentsInClass = await prisma.student.findMany({
      where: { schoolId: exam.schoolId, classId },
      include: { class: true },
    });

    let student = studentsInClass.find(
      (s) => s.name.trim().toLowerCase() === cleanName
    );

    if (!student) {
      // Auto-create student record in this class if not pre-registered
      student = await prisma.student.create({
        data: {
          schoolId: exam.schoolId,
          name: rawName,
          classId,
          status: "ACTIVE",
        },
        include: { class: true },
      });
    }

    if (student.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: { code: "STUDENT_INACTIVE", message: "Data murid dinonaktifkan di sekolah." } },
        { status: 403 }
      );
    }

    // Check individual Student PIN if set
    if (student.pin && pin && student.pin !== pin) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STUDENT_PIN", message: "PIN peserta tidak valid." } },
        { status: 400 }
      );
    }

    // 3. Check Attempts and Active Sessions
    const attempts = await prisma.examAttempt.findMany({
      where: { examId: exam.id, studentId: student.id },
      orderBy: { attemptNumber: "asc" },
    });

    const activeAttempt = attempts.find((a) => a.status === "IN_PROGRESS");
    const completedAttemptsCount = attempts.filter((a) => a.status === "SUBMITTED" || a.status === "EXPIRED").length;

    // Check exam schedule (allow if resuming active attempt)
    const now = new Date();
    if (!activeAttempt) {
      if (now < exam.startAt) {
        return NextResponse.json(
          { success: false, error: { code: "EXAM_NOT_STARTED", message: "Ujian belum dimulai sesuai jadwal." } },
          { status: 400 }
        );
      }
      if (now > exam.endAt) {
        return NextResponse.json(
          { success: false, error: { code: "EXAM_ENDED", message: "Waktu pelaksanaan ujian telah berakhir." } },
          { status: 400 }
        );
      }
      if (completedAttemptsCount >= exam.maxAttempts) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MAX_ATTEMPTS_REACHED",
              message: `Anda telah mencapai batas maksimal percobaan (${exam.maxAttempts} kali) untuk ujian ini.`,
            },
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          nis: student.nis,
          name: student.name,
          className: student.class.name,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          examCode: exam.examCode,
          durationMinutes: exam.durationMinutes,
          maxAttempts: exam.maxAttempts,
          instructions: exam.instructions,
          gradingMethod: exam.gradingMethod,
        },
        hasActiveAttempt: Boolean(activeAttempt),
        activeAttemptId: activeAttempt?.id || null,
        totalCompletedAttempts: completedAttemptsCount,
        remainingAttempts: Math.max(0, exam.maxAttempts - completedAttemptsCount),
      },
    });
  } catch (error: any) {
    console.error("Verify identity error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memverifikasi identitas." } },
      { status: 500 }
    );
  }
}
