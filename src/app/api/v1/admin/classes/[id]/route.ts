import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const { id } = params;
    const classItem = await prisma.class.findFirst({
      where: { id, schoolId: session.schoolId },
      include: {
        academicYear: true,
        _count: {
          select: { students: true, teacherClasses: true, examClasses: true },
        },
      },
    });

    if (!classItem) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Kelas tidak ditemukan." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: classItem });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data kelas." } },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang dapat mengubah kelas." } },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, gradeLevel, academicYearId } = body;

    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: session.schoolId },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Kelas tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === "") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama kelas tidak boleh kosong." } },
        { status: 400 }
      );
    }

    let parsedGrade = existingClass.gradeLevel;
    if (gradeLevel !== undefined && gradeLevel !== null) {
      const num = parseInt(String(gradeLevel), 10);
      parsedGrade = isNaN(num) ? 0 : num;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingClass.name,
        gradeLevel: parsedGrade,
        ...(academicYearId !== undefined ? { academicYearId: academicYearId || null } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "UPDATE_CLASS",
        details: `Mengubah kelas: ${existingClass.name} -> ${updatedClass.name} (Tingkat ${updatedClass.gradeLevel})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updatedClass });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui kelas." } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang dapat menghapus kelas." } },
        { status: 403 }
      );
    }

    const { id } = params;
    const existingClass = await prisma.class.findFirst({
      where: { id, schoolId: session.schoolId },
      include: {
        _count: {
          select: { students: true, teacherClasses: true, examClasses: true },
        },
      },
    });

    if (!existingClass) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Kelas tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Delete class (Prisma relations are configured with cascade)
    await prisma.class.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "DELETE_CLASS",
        details: `Menghapus kelas ${existingClass.name} (Tingkat ${existingClass.gradeLevel}). Terkait ${existingClass._count.students} murid, ${existingClass._count.teacherClasses} guru, ${existingClass._count.examClasses} ujian.`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Kelas ${existingClass.name} berhasil dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus kelas." } },
      { status: 500 }
    );
  }
}
