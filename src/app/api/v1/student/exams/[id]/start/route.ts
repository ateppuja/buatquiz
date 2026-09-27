import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signStudentExamToken } from "@/lib/auth";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id: examId } = params;
    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "ID murid wajib disertakan." } },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!exam || exam.status !== "PUBLISHED") {
      return NextResponse.json(
        { success: false, error: { code: "EXAM_UNAVAILABLE", message: "Ujian tidak tersedia." } },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: "STUDENT_NOT_FOUND", message: "Murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Check for existing active attempt
    let activeAttempt = await prisma.examAttempt.findFirst({
      where: { examId, studentId, status: "IN_PROGRESS" },
      include: {
        questionOrder: {
          include: {
            question: {
              include: { options: true },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
        answers: true,
      },
    });

    const now = new Date();

    if (activeAttempt) {
      // Check if deadline has passed
      if (now > activeAttempt.deadlineAt) {
        // Auto-expire attempt
        activeAttempt = await prisma.examAttempt.update({
          where: { id: activeAttempt.id },
          data: { status: "EXPIRED", submittedAt: now },
          include: {
            questionOrder: {
              include: { question: { include: { options: true } } },
              orderBy: { orderIndex: "asc" },
            },
            answers: true,
          },
        });
      } else {
        // Return existing active attempt!
        const token = await signStudentExamToken({
          attemptId: activeAttempt.id,
          examId,
          studentId: student.id,
          schoolId: exam.schoolId,
          nis: student.nis || undefined,
          studentName: student.name,
        });

        const response = NextResponse.json({
          success: true,
          data: {
            attemptId: activeAttempt.id,
            attemptNumber: activeAttempt.attemptNumber,
            deadlineAt: activeAttempt.deadlineAt,
            isResumed: true,
          },
        });

        response.cookies.set("student_exam_token", token, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 60 * 60 * 24,
          path: "/",
        });

        return response;
      }
    }

    // Check attempt limits
    const pastAttempts = await prisma.examAttempt.findMany({
      where: { examId, studentId },
    });

    if (pastAttempts.length >= exam.maxAttempts) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MAX_ATTEMPTS_REACHED",
            message: `Kuota percobaan ujian Anda telah habis (${exam.maxAttempts} kali).`,
          },
        },
        { status: 400 }
      );
    }

    // Compute deadline: Math.min(startedAt + duration, exam.endAt)
    const startedAt = new Date();
    const durationEnd = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);
    const deadlineAt = durationEnd < exam.endAt ? durationEnd : exam.endAt;
    const nextAttemptNumber = pastAttempts.length + 1;

    // Create new attempt
    const newAttempt = await prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        attemptNumber: nextAttemptNumber,
        status: "IN_PROGRESS",
        startedAt,
        deadlineAt,
        earnedPoints: 0,
        maxPoints: exam.questions.reduce((acc, q) => acc + q.points, 0),
        finalScore: 0,
        gradingStatus: "PENDING",
      },
    });

    // Create randomized Question Order & Option Order if enabled
    let orderedQuestions = [...exam.questions];
    if (exam.shuffleQuestions) {
      orderedQuestions = shuffleArray(orderedQuestions);
    }

    for (let i = 0; i < orderedQuestions.length; i++) {
      const q = orderedQuestions[i];
      let optionOrder = q.options.map((o) => o.id);
      if (exam.shuffleOptions && q.type === "MULTIPLE_CHOICE") {
        optionOrder = shuffleArray(optionOrder);
      }

      await prisma.attemptQuestionOrder.create({
        data: {
          attemptId: newAttempt.id,
          questionId: q.id,
          orderIndex: i,
          optionOrderJson: JSON.stringify(optionOrder),
        },
      });
    }

    const token = await signStudentExamToken({
      attemptId: newAttempt.id,
      examId,
      studentId: student.id,
      schoolId: exam.schoolId,
      nis: student.nis || undefined,
      studentName: student.name,
    });

    const response = NextResponse.json({
      success: true,
      data: {
        attemptId: newAttempt.id,
        attemptNumber: newAttempt.attemptNumber,
        deadlineAt: newAttempt.deadlineAt,
        isResumed: false,
      },
    });

    response.cookies.set("student_exam_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Start exam error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memulai sesi ujian." } },
      { status: 500 }
    );
  }
}
