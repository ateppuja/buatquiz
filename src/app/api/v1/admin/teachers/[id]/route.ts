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
    const { name, username, nip, email, status, password, classIds, subjectIds } = body;

    const teacher = await prisma.user.findFirst({
      where: { id, schoolId: session.schoolId, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Guru tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Check username uniqueness if changed
    if (username && username.trim() !== teacher.username) {
      const existingUser = await prisma.user.findFirst({
        where: { username: username.trim(), id: { not: id } },
      });
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: { code: "DUPLICATE", message: `Username "${username}" sudah digunakan.` } },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (username) updateData.username = username.trim();
    if (nip !== undefined) updateData.nip = nip ? nip.trim() : null;
    if (email) updateData.email = email.trim();
    if (status) updateData.status = status;
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update teacher classes assignments if provided
    if (Array.isArray(classIds)) {
      await prisma.teacherClass.deleteMany({ where: { teacherId: id } });
      const currentSubjects = await prisma.subject.findMany({ where: { schoolId: session.schoolId } });
      const defaultSubjectId = currentSubjects[0]?.id;

      for (const cId of classIds) {
        if (Array.isArray(subjectIds) && subjectIds.length > 0) {
          for (const sId of subjectIds) {
            await prisma.teacherClass.create({
              data: { teacherId: id, classId: cId, subjectId: sId },
            }).catch(() => {});
          }
        } else if (defaultSubjectId) {
          await prisma.teacherClass.create({
            data: { teacherId: id, classId: cId, subjectId: defaultSubjectId },
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

    const teacher = await prisma.user.findFirst({
      where: { id, schoolId: session.schoolId, role: "TEACHER" },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Guru tidak ditemukan." } },
        { status: 404 }
      );
    }

    // Delete teacher (cascade deletes teacher_classes, exams, questions, attempts)
    await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "DELETE_TEACHER",
        details: JSON.stringify({ teacherId: id, name: teacher.name, username: teacher.username }),
      },
    });

    return NextResponse.json({ success: true, message: `Akun guru ${teacher.name} berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menghapus akun guru." } },
      { status: 500 }
    );
  }
}
