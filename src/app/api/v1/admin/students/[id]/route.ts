import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const { id } = params;

    const student = await prisma.student.findFirst({
      where: { id, schoolId: session.schoolId },
      include: { class: true },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat data murid." } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang memiliki akses." } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, nis, classId, gender, pin, status } = body;

    const student = await prisma.student.findFirst({
      where: { id, schoolId: session.schoolId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (nis !== undefined) updateData.nis = nis ? nis.trim() : null;
    if (classId) updateData.classId = classId;
    if (gender) updateData.gender = gender;
    if (pin !== undefined) updateData.pin = pin ? pin.trim() : null;
    if (status) updateData.status = status;

    const updated = await prisma.student.update({
      where: { id },
      data: updateData,
      include: { class: true },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "UPDATE_STUDENT",
        details: JSON.stringify({ studentId: id, changes: updateData }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui data murid." } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang memiliki akses." } },
        { status: 403 }
      );
    }

    const { id } = params;

    const student = await prisma.student.findFirst({
      where: { id, schoolId: session.schoolId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Data murid tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Delete student (cascade deletes attempts, answers, exam_results)
    await prisma.student.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "DELETE_STUDENT",
        details: JSON.stringify({ studentId: id, name: student.name, nis: student.nis }),
      },
    });

    return NextResponse.json({ success: true, message: `Data murid ${student.name} berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus data murid." } },
      { status: 500 }
    );
  }
}
