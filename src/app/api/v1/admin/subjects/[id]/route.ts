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
    const subject = await prisma.subject.findFirst({
      where: { id, schoolId: session.schoolId },
      include: {
        _count: {
          select: { exams: true, teacherClasses: true },
        },
      },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Mata pelajaran tidak ditemukan." } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: subject });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal mengambil data mata pelajaran." } },
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
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { name, code } = body;

    const existingSubject = await prisma.subject.findFirst({
      where: { id, schoolId: session.schoolId },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Mata pelajaran tidak ditemukan." } },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === "") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama mata pelajaran tidak boleh kosong." } },
        { status: 400 }
      );
    }

    let updatedCode = existingSubject.code;
    if (code !== undefined && code.trim() !== "") {
      updatedCode = code.trim().toUpperCase();
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existingSubject.name,
        code: updatedCode,
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "UPDATE_SUBJECT",
        details: `Mengubah mata pelajaran: ${existingSubject.name} (${existingSubject.code}) -> ${updatedSubject.name} (${updatedSubject.code})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: updatedSubject });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui mata pelajaran." } },
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
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const { id } = params;
    const existingSubject = await prisma.subject.findFirst({
      where: { id, schoolId: session.schoolId },
      include: {
        _count: {
          select: { exams: true },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Mata pelajaran tidak ditemukan." } },
        { status: 404 }
      );
    }

    await prisma.subject.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "DELETE_SUBJECT",
        details: `Menghapus mata pelajaran: ${existingSubject.name} (${existingSubject.code})`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Mata pelajaran ${existingSubject.name} berhasil dihapus.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus mata pelajaran." } },
      { status: 500 }
    );
  }
}
