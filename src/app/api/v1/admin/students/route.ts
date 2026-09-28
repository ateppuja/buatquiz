import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Sesi telah berakhir." } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const search = searchParams.get("q");

    const whereClause: any = { schoolId: session.schoolId };
    if (classId) whereClause.classId = classId;
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { nis: { contains: search } },
      ];
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        class: true,
      },
      orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat data murid." } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang dapat mendaftarkan murid." } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nis, name, classId, gender, pin } = body;

    if (!name || !classId) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_INPUT", message: "Nama dan Kelas wajib diisi." } },
        { status: 400 }
      );
    }

    const student = await prisma.student.create({
      data: {
        schoolId: session.schoolId,
        nis: nis || null,
        name,
        classId,
        gender: gender || "L",
        pin: pin || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, data: student });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal menambahkan data murid." } },
      { status: 500 }
    );
  }
}
