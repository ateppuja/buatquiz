import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { name, nip, email, status, password, classIds, subjectIds } = body;

    const teacher = await prisma.user.findFirst({
      where: { id, schoolId: session.schoolId, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Guru tidak ditemukan." } },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (nip !== undefined) updateData.nip = nip || null;
    if (email) updateData.email = email;
    if (status) updateData.status = status;
    if (password) updateData.passwordHash = await hashPassword(password);

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update teacher classes assignments if provided
    if (Array.isArray(classIds) && Array.isArray(subjectIds)) {
      await prisma.teacherClass.deleteMany({ where: { teacherId: id } });
      for (const cId of classIds) {
        for (const sId of subjectIds) {
          await prisma.teacherClass.create({
            data: { teacherId: id, classId: cId, subjectId: sId },
          }).catch(() => {});
        }
      }
    }

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "UPDATE_TEACHER",
        details: JSON.stringify({ teacherId: id, changes: updateData }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memperbarui data guru." } },
      { status: 500 }
    );
  }
}
