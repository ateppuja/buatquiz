import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Hanya administrator yang memiliki akses." } },
        { status: 403 }
      );
    }

    const exams = await prisma.exam.findMany({
      where: { schoolId: session.schoolId },
      include: {
        teacher: { select: { name: true, email: true } },
        subject: { select: { name: true, code: true } },
        examClasses: { include: { class: true } },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: exams });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat seluruh daftar ujian." } },
      { status: 500 }
    );
  }
}
