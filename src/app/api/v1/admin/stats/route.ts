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

    const [
      totalTeachers,
      totalStudents,
      totalClasses,
      totalExams,
      activeExams,
      totalAttempts,
      recentLogs,
      school,
    ] = await Promise.all([
      prisma.user.count({ where: { schoolId: session.schoolId, role: "TEACHER" } }),
      prisma.student.count({ where: { schoolId: session.schoolId } }),
      prisma.class.count({ where: { schoolId: session.schoolId } }),
      prisma.exam.count({ where: { schoolId: session.schoolId } }),
      prisma.exam.count({ where: { schoolId: session.schoolId, status: "PUBLISHED" } }),
      prisma.examAttempt.count({ where: { exam: { schoolId: session.schoolId } } }),
      prisma.auditLog.findMany({
        where: { schoolId: session.schoolId },
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.school.findUnique({
        where: { id: session.schoolId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalTeachers,
        totalStudents,
        totalClasses,
        totalExams,
        activeExams,
        totalAttempts,
        recentLogs,
        school,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Gagal memuat statistik." } },
      { status: 500 }
    );
  }
}
