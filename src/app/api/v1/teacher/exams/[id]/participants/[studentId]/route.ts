import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id: examId, studentId } = params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, nis, classId, pin } = body;

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (nis !== undefined) updateData.nis = nis ? nis.trim() : null;
    if (pin !== undefined) updateData.pin = pin ? pin.trim() : null;
    if (classId) {
      const cls = await prisma.class.findUnique({ where: { id: classId } });
      if (cls && cls.schoolId === session.schoolId) {
        updateData.classId = classId;
      }
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
      include: { class: true },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "STUDENT_UPDATED",
        details: JSON.stringify({
          examId,
          studentId,
          oldName: student.name,
          newName: updatedStudent.name,
          oldNis: student.nis,
          newNis: updatedStudent.nis,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: updatedStudent,
      message: `Data peserta ${updatedStudent.name} berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error("Update participant error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui data peserta." } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; studentId: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi tidak valid." } },
        { status: 401 }
      );
    }

    const { id: examId, studentId } = params;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "exam_only"; // "exam_only" or "permanent"

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Ujian tidak ditemukan." } },
        { status: 404 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student || student.schoolId !== session.schoolId) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (mode === "permanent") {
      // Delete student completely from database (cascades to all attempts/results)
      await prisma.student.delete({
        where: { id: studentId },
      });

      await prisma.auditLog.create({
        data: {
          schoolId: session.schoolId,
          userId: session.userId,
          action: "STUDENT_DELETED_PERMANENT",
          details: JSON.stringify({
            examId,
            studentId,
            studentName: student.name,
            nis: student.nis,
          }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Akun murid "${student.name}" telah dihapus permanen dari sistem sekolah.`,
      });
    } else {
      // Remove student participation / attempts / results from this exam only
      await prisma.answer.deleteMany({
        where: {
          attempt: {
            examId,
            studentId,
          },
        },
      });

      await prisma.attemptQuestionOrder.deleteMany({
        where: {
          attempt: {
            examId,
            studentId,
          },
        },
      });

      await prisma.examAttempt.deleteMany({
        where: {
          examId,
          studentId,
        },
      });

      await prisma.examResult.deleteMany({
        where: {
          examId,
          studentId,
        },
      });

      await prisma.auditLog.create({
        data: {
          schoolId: session.schoolId,
          userId: session.userId,
          action: "PARTICIPANT_REMOVED_FROM_EXAM",
          details: JSON.stringify({
            examId,
            studentId,
            studentName: student.name,
            nis: student.nis,
          }),
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `Hasil dan data partisipasi "${student.name}" berhasil dihapus dari ujian ini.`,
      });
    }
  } catch (error: any) {
    console.error("Delete participant error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus data peserta." } },
      { status: 500 }
    );
  }
}
