import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang memiliki akses." } },
        { status: 403 }
      );
    }

    const teachers = await prisma.user.findMany({
      where: { schoolId: session.schoolId, role: "TEACHER" },
      select: {
        id: true,
        name: true,
        nip: true,
        email: true,
        username: true,
        status: true,
        createdAt: true,
        teacherClasses: {
          include: {
            class: true,
            subject: true,
          },
        },
        _count: {
          select: { exams: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: teachers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat daftar guru." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang memiliki akses." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, nip, email, username, password, classIds, subjectIds } = body;

    const rawUsername = String(username || "").trim();
    const cleanUsername = rawUsername.toLowerCase();
    const rawName = String(name || "").trim();

    if (!rawName || !cleanUsername || !password) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama, username, dan password wajib diisi." } },
        { status: 400 }
      );
    }

    const teacherEmail = email ? String(email).trim().toLowerCase() : `${cleanUsername}@examcode.sch.id`;

    // Check duplicate
    const existing = await prisma.user.findFirst({
      where: {
        schoolId: session.schoolId,
        OR: [{ email: teacherEmail }, { username: cleanUsername }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { code: "DUPLICATE_USER", message: `Username '${cleanUsername}' sudah terdaftar.` } },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const teacher = await prisma.user.create({
      data: {
        schoolId: session.schoolId,
        name: rawName,
        nip: nip || null,
        email: teacherEmail,
        username: cleanUsername,
        passwordHash,
        role: "TEACHER",
        status: "ACTIVE",
      },
    });

    // Assign classes
    if (Array.isArray(classIds) && classIds.length > 0) {
      let schoolSubjects: any[] = [];
      if (Array.isArray(subjectIds) && subjectIds.length > 0) {
        schoolSubjects = await prisma.subject.findMany({
          where: { id: { in: subjectIds }, schoolId: session.schoolId },
        });
      }
      if (schoolSubjects.length === 0) {
        schoolSubjects = await prisma.subject.findMany({
          where: { schoolId: session.schoolId },
        });
      }
      if (schoolSubjects.length === 0) {
        const defSub = await prisma.subject.create({
          data: { schoolId: session.schoolId, name: "Umum", code: "UMUM" },
        });
        schoolSubjects = [defSub];
      }

      for (const cId of classIds) {
        for (const sub of schoolSubjects) {
          await prisma.teacherClass.create({
            data: {
              teacherId: teacher.id,
              classId: cId,
              subjectId: sub.id,
            },
          }).catch(() => {});
        }
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "CREATE_TEACHER",
        details: JSON.stringify({ teacherId: teacher.id, teacherName: teacher.name }),
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: teacher.id, name: teacher.name, email: teacher.email, username: teacher.username },
    });
  } catch (error: any) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat akun guru." } },
      { status: 500 }
    );
  }
}
