import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const subjects = await prisma.subject.findMany({
      where: { schoolId: session.schoolId },
      include: {
        _count: {
          select: { exams: true, teacherClasses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: subjects });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat daftar mata pelajaran." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const body = await req.json();
    let { name, code } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama mata pelajaran wajib diisi." } },
        { status: 400 }
      );
    }

    // Auto-generate code if omitted
    if (!code || code.trim() === "") {
      const words = name.trim().split(/\s+/);
      if (words.length >= 2) {
        code = words.map((w: string) => w[0]).join("").toUpperCase().slice(0, 5);
      } else {
        code = name.trim().slice(0, 3).toUpperCase();
      }
    } else {
      code = code.trim().toUpperCase();
    }

    const newSubject = await prisma.subject.create({
      data: {
        schoolId: session.schoolId,
        name: name.trim(),
        code,
      },
    });

    await prisma.auditLog.create({
      data: {
        schoolId: session.schoolId,
        userId: session.userId,
        action: "CREATE_SUBJECT",
        details: `Membuat mata pelajaran: ${newSubject.name} (${newSubject.code})`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newSubject });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal membuat mata pelajaran baru." } },
      { status: 500 }
    );
  }
}
