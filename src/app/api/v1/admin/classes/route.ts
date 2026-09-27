import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const classes = await prisma.class.findMany({
      where: { schoolId: session.schoolId },
      include: {
        academicYear: true,
        _count: {
          select: { students: true, teacherClasses: true, examClasses: true },
        },
      },
      orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: classes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat daftar kelas." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang dapat membuat kelas." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, gradeLevel, academicYearId } = body;

    if (!name || name.trim() === "" || gradeLevel === undefined || gradeLevel === null) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama kelas dan tingkat kelas wajib diisi." } },
        { status: 400 }
      );
    }

    // Get or fallback to active academic year
    let ayId = academicYearId;
    if (!ayId) {
      const activeAY = await prisma.academicYear.findFirst({
        where: { schoolId: session.schoolId, isActive: true },
      });
      ayId = activeAY?.id;
    }

    const parsedGrade = parseInt(String(gradeLevel), 10);

    const newClass = await prisma.class.create({
      data: {
        schoolId: session.schoolId,
        name: name.trim(),
        gradeLevel: isNaN(parsedGrade) ? 0 : parsedGrade,
        academicYearId: ayId || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "CREATE_CLASS",
        details: `Membuat kelas baru: ${newClass.name} (Tingkat ${newClass.gradeLevel})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newClass });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat kelas baru." } },
      { status: 500 }
    );
  }
}
